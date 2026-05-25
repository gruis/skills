# Current MCH Architecture Position

Use this as current review context, not as an immutable rule. If a newer
architecture document exists, prefer that document.

## Preferred

MedAHA remains the authoritative source for Aha!ログ product components. Shopify
is the standardized commerce integration platform. MedAHA Sync publishes to
Shopify, Sync webhooks/pull APIs, and optionally AS-formatted object-store files
for efficient indexing.

Hydrogen reads canonical commerce/product data from Shopify. Search is used for
search, filtering, ranking, and read-optimized listing projections, but every
search document remains rebuildable from MedAHA-owned sources.

## Acceptable

Search/index can serve denormalized PLP/result-card data or hospital-scoped
derived data if it is fully rebuildable, documented, inspectable, not the only
place business-owned product state lives, and kept in sync with data in other
components.

## Not Acceptable

- A partner-owned private store as the only PDP/PLP product backend.
- Shopify reduced to image hosting/checkout.
- Vendor-specific index payloads becoming the real contract.
- Any expectation that Shopify webhooks emit custom MedAHA Sync/AdvantageSearch
  payloads.

## Shopify Webhook Nuance

Shopify webhooks can notify subscribers of Shopify-originated changes and
deliver Shopify-native payloads. Webhook subscriptions can include configured
metafield namespaces, but field names and value shapes depend on the Shopify
metafield definitions and webhook subscription configuration.

MedAHA Sync can emit MedAHA-owned webhooks, pull APIs, or AS-oriented JSON
object-store files. Those are separate integration contracts and should not be
called Shopify webhook payloads.

If Appirits/AS consumes Shopify native webhooks and produces AS/index documents,
the mapping should be documented in the Search ETL layer.

## Product Terminology

For external comments, speak in product/system terms:

- MedAHA
- MedAHA Sync
- MedAHA API
- MedAHA Server
- Shopify
- Search ETL
- AdvantageSearch / Search Adapter

Do not mention Directus unless the external audience has already been given that
implementation detail.
