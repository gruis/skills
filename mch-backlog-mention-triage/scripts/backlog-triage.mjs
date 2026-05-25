#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = parseArgs(process.argv.slice(2));
const projectKey = args.project || 'MCH';
const since = args.since || null;
const output = args.output || null;
const notificationCount = Number(args['notification-count'] || 100);
const base = 'https://appirits.backlog.jp/api/v2';

const apiKey = loadApiKey();
const fetchedAt = new Date().toISOString();

const me = await get('/users/myself');
const project = await get(`/projects/${encodeURIComponent(projectKey)}`);

const assigned = await get('/issues', {
  'projectId[]': [project.id],
  'assigneeId[]': [me.id],
  count: 100,
  sort: 'updated',
  order: 'desc',
});

const recent = since
  ? await get('/issues', {
      'projectId[]': [project.id],
      updatedSince: since,
      count: 100,
      sort: 'updated',
      order: 'desc',
    })
  : [];

const notifications = await get('/notifications', {
  count: notificationCount,
  order: 'desc',
});

const issueMap = new Map();
for (const issue of assigned) issueMap.set(issue.issueKey, issue);
for (const issue of recent) issueMap.set(issue.issueKey, issue);
for (const notification of notifications) {
  if (notification.issue?.issueKey) {
    issueMap.set(notification.issue.issueKey, notification.issue);
  }
}

const comments = {};
for (const key of issueMap.keys()) {
  comments[key] = await get(`/issues/${encodeURIComponent(key)}/comments`, {
    count: 100,
    order: 'asc',
  });
}

const analysis = analyze({ me, assigned, recent, notifications, comments, issueMap });
const result = {
  fetchedAt,
  baseline: { since },
  me: pickUser(me),
  project: { id: project.id, projectKey: project.projectKey, name: project.name },
  counts: {
    assigned: assigned.length,
    recent: recent.length,
    notifications: notifications.length,
    commentThreads: Object.keys(comments).length,
  },
  assigned: assigned.map(issueSummary),
  recent: recent.map(issueSummary),
  analysis,
};

const json = JSON.stringify(result, null, 2);
if (output) {
  fs.writeFileSync(output, `${json}\n`);
  console.log(JSON.stringify({ output, ...result.counts }, null, 2));
} else {
  console.log(json);
}

function analyze({ me, assigned, recent, notifications, comments, issueMap }) {
  const assignedStatus = assigned.map((issue) => {
    const own = lastOwnComment(issue.issueKey);
    return {
      ...issueSummary(issue),
      lastOwnComment: own && commentSummary(own),
      otherCommentsAfterLastOwn: commentsAfterLastOwn(issue.issueKey),
    };
  });

  const mentioned = [];
  for (const [key, issue] of issueMap.entries()) {
    const own = lastOwnComment(key);
    const hits = thread(key).filter((comment) => {
      return (
        comment.createdUser?.id !== me.id &&
        (comment.content || '').includes('@Caleb Crane') &&
        (!own || new Date(comment.created) > new Date(own.created))
      );
    });
    if (hits.length) {
      mentioned.push({
        ...issueSummary(issue),
        lastOwnComment: own && commentSummary(own),
        mentionsAfterLastOwn: hits.map(commentSummary),
      });
    }
  }

  const newAfterOwn = [];
  for (const [key, issue] of issueMap.entries()) {
    const after = commentsAfterLastOwn(key);
    if (after.length) {
      newAfterOwn.push({
        ...issueSummary(issue),
        lastOwnComment: lastOwnComment(key) && commentSummary(lastOwnComment(key)),
        otherCommentsAfterLastOwn: after,
      });
    }
  }

  const notificationIssues = new Map();
  for (const notification of notifications) {
    const key = notification.issue?.issueKey;
    if (!key || notification.sender?.id === me.id) continue;
    if (!notificationIssues.has(key)) {
      notificationIssues.set(key, {
        ...issueSummary(issueMap.get(key) || notification.issue),
        notifications: [],
      });
    }
    notificationIssues.get(key).notifications.push({
      id: notification.id,
      reason: notification.reason,
      alreadyRead: notification.alreadyRead,
      resourceAlreadyRead: notification.resourceAlreadyRead,
      created: notification.created,
      sender: pickUser(notification.sender),
      comment: notification.comment && {
        id: notification.comment.id,
        content: trim(notification.comment.content),
      },
    });
  }

  return {
    assignedStatus,
    mentionedAfterLastOwn: mentioned,
    newCommentsAfterLastOwn: newAfterOwn,
    notificationIssues: [...notificationIssues.values()],
    boxLinks: boxLinksByIssue(),
    recentWithoutOwnResponse: recent
      .map((issue) => ({
        ...issueSummary(issue),
        lastOwnComment: lastOwnComment(issue.issueKey) && commentSummary(lastOwnComment(issue.issueKey)),
        otherCommentsAfterLastOwn: commentsAfterLastOwn(issue.issueKey),
      }))
      .filter((issue) => issue.otherCommentsAfterLastOwn.length > 0),
  };

  function thread(key) {
    return (comments[key] || []).slice().sort((a, b) => new Date(a.created) - new Date(b.created));
  }

  function lastOwnComment(key) {
    return thread(key).filter((comment) => comment.createdUser?.id === me.id).at(-1);
  }

  function commentsAfterLastOwn(key) {
    const own = lastOwnComment(key);
    return thread(key)
      .filter((comment) => {
        return comment.createdUser?.id !== me.id && (!own || new Date(comment.created) > new Date(own.created));
      })
      .map(commentSummary);
  }

  function boxLinksByIssue() {
    const issues = [];
    for (const [key, issue] of issueMap.entries()) {
      const hits = [];
      for (const comment of thread(key)) {
        const links = extractBoxLinks(comment.content || '');
        if (!links.length) continue;
        hits.push({
          comment: commentSummary(comment),
          links,
        });
      }
      if (hits.length) {
        issues.push({
          ...issueSummary(issue),
          boxReferences: hits,
        });
      }
    }
    return issues;
  }
}

async function get(endpoint, params = {}) {
  const url = new URL(`${base}${endpoint}`);
  url.searchParams.set('apiKey', apiKey);
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) url.searchParams.append(key, item);
    } else if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${endpoint} ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

function loadApiKey() {
  if (process.env.BACKLOG_API_KEY) return process.env.BACKLOG_API_KEY;
  const envPath = path.join(os.homedir(), '.config', 'backlog.env');
  const text = fs.readFileSync(envPath, 'utf8');
  const match = text.match(/^BACKLOG_API_KEY=(.*)$/m);
  if (!match) throw new Error(`BACKLOG_API_KEY not found in ${envPath}`);
  return match[1].replace(/^['"]|['"]$/g, '');
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

function issueSummary(issue) {
  return {
    key: issue.issueKey,
    summary: issue.summary,
    status: issue.status?.name,
    assignee: issue.assignee && pickUser(issue.assignee),
    updated: issue.updated,
    created: issue.created,
    issueType: issue.issueType?.name,
    priority: issue.priority?.name,
    url: `https://appirits.backlog.jp/view/${issue.issueKey}`,
  };
}

function commentSummary(comment) {
  return {
    id: comment.id,
    created: comment.created,
    user: pickUser(comment.createdUser),
    content: trim(comment.content),
  };
}

function pickUser(user) {
  if (!user) return null;
  return { id: user.id, name: user.name, userId: user.userId };
}

function trim(value, length = 800) {
  const text = value || '';
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function extractBoxLinks(text) {
  const links = [];
  const seen = new Set();
  const pattern = /https?:\/\/[^\s)\]]*box\.com\/s\/([A-Za-z0-9_-]+)/g;
  for (const match of text.matchAll(pattern)) {
    const url = match[0];
    const slug = match[1];
    if (seen.has(url)) continue;
    seen.add(url);
    links.push({ url, slug });
  }
  return links;
}
