package com.nextware.dto.dashboard;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Company-scoped operational snapshot for the dashboard.
 *
 * <p>Every block is nullable: a block is {@code null} when the authenticated
 * user does not hold the corresponding {@code *_VIEW} permission, so the
 * frontend renders only what the user is allowed to see.</p>
 *
 * <p>All figures are derived from currently implemented master-data tables.
 * Inventory, purchasing, sales and fulfillment analytics are intentionally
 * absent until those modules produce transactional data.</p>
 */
public record DashboardSummaryResponse(
        PeriodInfo period,
        ProductsBlock products,
        CountBlock categories,
        CountBlock unitsOfMeasure,
        CountBlock customers,
        CountBlock suppliers,
        WarehousesBlock warehouses,
        LocationsBlock warehouseLocations,
        List<GrowthPoint> catalogGrowth,
        List<AttentionItem> needsAttention,
        OffsetDateTime generatedAt
) {

    public record PeriodInfo(
            String key,
            String label,
            OffsetDateTime from,
            OffsetDateTime to
    ) {
    }

    public record CountBlock(
            long total,
            long active,
            long inactive,
            long addedInPeriod
    ) {
    }

    public record ProductsBlock(
            long total,
            long active,
            long inactive,
            long addedInPeriod,
            long missingCategory,
            long missingSellingPrice,
            long missingBarcode,
            List<CategorySlice> byCategory,
            List<RecentProduct> recent
    ) {
    }

    public record CategorySlice(
            String categoryId,
            String categoryName,
            long count
    ) {
    }

    public record RecentProduct(
            String id,
            String sku,
            String name,
            boolean active,
            OffsetDateTime createdAt
    ) {
    }

    public record WarehousesBlock(
            long total,
            long active,
            long inactive,
            List<WarehouseSlice> byWarehouse
    ) {
    }

    public record WarehouseSlice(
            String warehouseId,
            String code,
            String name,
            boolean active,
            long locationCount
    ) {
    }

    public record LocationsBlock(
            long total,
            long active,
            List<TypeSlice> byType
    ) {
    }

    public record TypeSlice(
            String type,
            long count
    ) {
    }

    public record GrowthPoint(
            String date,
            long added,
            long cumulative
    ) {
    }

    public record AttentionItem(
            String kind,
            String label,
            long count,
            String severity,
            String href
    ) {
    }
}
