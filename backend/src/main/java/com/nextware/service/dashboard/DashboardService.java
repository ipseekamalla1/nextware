package com.nextware.service.dashboard;

import com.nextware.dto.dashboard.DashboardSummaryResponse;
import com.nextware.dto.dashboard.DashboardSummaryResponse.AttentionItem;
import com.nextware.dto.dashboard.DashboardSummaryResponse.CategorySlice;
import com.nextware.dto.dashboard.DashboardSummaryResponse.CountBlock;
import com.nextware.dto.dashboard.DashboardSummaryResponse.GrowthPoint;
import com.nextware.dto.dashboard.DashboardSummaryResponse.LocationsBlock;
import com.nextware.dto.dashboard.DashboardSummaryResponse.PeriodInfo;
import com.nextware.dto.dashboard.DashboardSummaryResponse.ProductsBlock;
import com.nextware.dto.dashboard.DashboardSummaryResponse.RecentProduct;
import com.nextware.dto.dashboard.DashboardSummaryResponse.TypeSlice;
import com.nextware.dto.dashboard.DashboardSummaryResponse.WarehouseSlice;
import com.nextware.dto.dashboard.DashboardSummaryResponse.WarehousesBlock;
import com.nextware.entity.Category;
import com.nextware.entity.Product;
import com.nextware.entity.Warehouse;
import com.nextware.repository.CategoryRepository;
import com.nextware.repository.CustomerRepository;
import com.nextware.repository.ProductRepository;
import com.nextware.repository.SupplierRepository;
import com.nextware.repository.UnitOfMeasureRepository;
import com.nextware.repository.WarehouseLocationRepository;
import com.nextware.repository.WarehouseRepository;
import com.nextware.security.CompanySecurityService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.IsoFields;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

@Service
public class DashboardService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final UnitOfMeasureRepository unitOfMeasureRepository;
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseLocationRepository warehouseLocationRepository;
    private final CompanySecurityService companySecurityService;

    public DashboardService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            UnitOfMeasureRepository unitOfMeasureRepository,
            CustomerRepository customerRepository,
            SupplierRepository supplierRepository,
            WarehouseRepository warehouseRepository,
            WarehouseLocationRepository warehouseLocationRepository,
            CompanySecurityService companySecurityService
    ) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.unitOfMeasureRepository = unitOfMeasureRepository;
        this.customerRepository = customerRepository;
        this.supplierRepository = supplierRepository;
        this.warehouseRepository = warehouseRepository;
        this.warehouseLocationRepository = warehouseLocationRepository;
        this.companySecurityService = companySecurityService;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary(String periodKey) {

        UUID companyId =
                companySecurityService.getAuthenticatedCompanyId();

        Period period = Period.resolve(periodKey);

        ProductsBlock products =
                can("PRODUCT_VIEW")
                        ? buildProducts(companyId, period)
                        : null;

        CountBlock categories =
                can("CATEGORY_VIEW")
                        ? new CountBlock(
                        categoryRepository.countByCompanyId(companyId),
                        categoryRepository.countByCompanyIdAndActive(companyId, true),
                        categoryRepository.countByCompanyIdAndActive(companyId, false),
                        0)
                        : null;

        CountBlock unitsOfMeasure =
                can("UNIT_OF_MEASURE_VIEW")
                        ? new CountBlock(
                        unitOfMeasureRepository.countByCompanyId(companyId),
                        unitOfMeasureRepository.countByCompanyIdAndActive(companyId, true),
                        unitOfMeasureRepository.countByCompanyIdAndActive(companyId, false),
                        0)
                        : null;

        CountBlock customers =
                can("CUSTOMER_VIEW")
                        ? new CountBlock(
                        customerRepository.countByCompanyId(companyId),
                        customerRepository.countByCompanyIdAndActive(companyId, true),
                        customerRepository.countByCompanyIdAndActive(companyId, false),
                        customerRepository.countByCompanyIdAndCreatedAtGreaterThanEqual(
                                companyId, period.from()))
                        : null;

        CountBlock suppliers =
                can("SUPPLIER_VIEW")
                        ? new CountBlock(
                        supplierRepository.countByCompanyId(companyId),
                        supplierRepository.countByCompanyIdAndActive(companyId, true),
                        supplierRepository.countByCompanyIdAndActive(companyId, false),
                        supplierRepository.countByCompanyIdAndCreatedAtGreaterThanEqual(
                                companyId, period.from()))
                        : null;

        List<Warehouse> companyWarehouses =
                (can("WAREHOUSE_VIEW") || can("WAREHOUSE_LOCATION_VIEW"))
                        ? warehouseRepository.findByCompanyId(companyId)
                        : List.of();

        WarehousesBlock warehouses =
                can("WAREHOUSE_VIEW")
                        ? buildWarehouses(companyWarehouses)
                        : null;

        LocationsBlock warehouseLocations =
                can("WAREHOUSE_LOCATION_VIEW")
                        ? buildLocations(companyWarehouses)
                        : null;

        List<GrowthPoint> catalogGrowth =
                can("PRODUCT_VIEW")
                        ? buildCatalogGrowth(companyId, period)
                        : null;

        List<AttentionItem> needsAttention =
                buildNeedsAttention(products, warehouses, customers, suppliers);

        return new DashboardSummaryResponse(
                new PeriodInfo(period.key(), period.label(), period.from(), period.to()),
                products,
                categories,
                unitsOfMeasure,
                customers,
                suppliers,
                warehouses,
                warehouseLocations,
                catalogGrowth,
                needsAttention,
                OffsetDateTime.now()
        );
    }

    /* ------------------------------------------------------------------ */

    private ProductsBlock buildProducts(UUID companyId, Period period) {

        long total = productRepository.countByCompanyId(companyId);
        long active = productRepository.countByCompanyIdAndActive(companyId, true);
        long inactive = productRepository.countByCompanyIdAndActive(companyId, false);
        long addedInPeriod =
                productRepository.countByCompanyIdAndCreatedAtGreaterThanEqual(
                        companyId, period.from());
        long missingCategory =
                productRepository.countByCompanyIdAndCategoryIdIsNull(companyId);
        long missingSellingPrice =
                productRepository.countByCompanyIdAndSellingPriceIsNull(companyId);
        long missingBarcode =
                productRepository.countByCompanyIdAndBarcodeIsNull(companyId);

        Map<UUID, String> categoryNames = new HashMap<>();
        for (Category category :
                categoryRepository.findAllByCompanyIdOrderByNameAsc(companyId)) {
            categoryNames.put(category.getId(), category.getName());
        }

        List<CategorySlice> byCategory = new ArrayList<>();
        for (ProductRepository.CategoryCount row :
                productRepository.countGroupedByCategory(companyId)) {

            UUID categoryId = row.getCategoryId();

            if (categoryId == null) {
                byCategory.add(new CategorySlice(null, "Uncategorized", row.getCount()));
            } else {
                byCategory.add(new CategorySlice(
                        categoryId.toString(),
                        categoryNames.getOrDefault(categoryId, "Unknown"),
                        row.getCount()));
            }
        }
        byCategory.sort(Comparator.comparingLong(CategorySlice::count).reversed());

        List<RecentProduct> recent = new ArrayList<>();
        for (Product product :
                productRepository.findTop5ByCompanyIdOrderByCreatedAtDesc(companyId)) {
            recent.add(new RecentProduct(
                    product.getId().toString(),
                    product.getSku(),
                    product.getName(),
                    product.isActive(),
                    product.getCreatedAt()));
        }

        return new ProductsBlock(
                total, active, inactive, addedInPeriod,
                missingCategory, missingSellingPrice, missingBarcode,
                byCategory, recent);
    }

    private WarehousesBlock buildWarehouses(List<Warehouse> companyWarehouses) {

        List<UUID> ids = companyWarehouses.stream()
                .map(Warehouse::getId)
                .toList();

        Map<UUID, Long> locationCounts = new HashMap<>();
        if (!ids.isEmpty()) {
            for (WarehouseLocationRepository.WarehouseCount row :
                    warehouseLocationRepository.countGroupedByWarehouse(ids)) {
                locationCounts.put(row.getWarehouseId(), row.getCount());
            }
        }

        long active = companyWarehouses.stream().filter(Warehouse::isActive).count();

        List<WarehouseSlice> slices = companyWarehouses.stream()
                .map(warehouse -> new WarehouseSlice(
                        warehouse.getId().toString(),
                        warehouse.getCode(),
                        warehouse.getName(),
                        warehouse.isActive(),
                        locationCounts.getOrDefault(warehouse.getId(), 0L)))
                .sorted(Comparator.comparing(WarehouseSlice::code))
                .toList();

        return new WarehousesBlock(
                companyWarehouses.size(),
                active,
                companyWarehouses.size() - active,
                slices);
    }

    private LocationsBlock buildLocations(List<Warehouse> companyWarehouses) {

        List<UUID> ids = companyWarehouses.stream()
                .map(Warehouse::getId)
                .toList();

        if (ids.isEmpty()) {
            return new LocationsBlock(0, 0, List.of());
        }

        long total = warehouseLocationRepository.countByWarehouseIdIn(ids);
        long active =
                warehouseLocationRepository.countByWarehouseIdInAndActive(ids, true);

        List<TypeSlice> byType = warehouseLocationRepository.countGroupedByType(ids)
                .stream()
                .map(row -> new TypeSlice(row.getType(), row.getCount()))
                .sorted(Comparator.comparingLong(TypeSlice::count).reversed())
                .toList();

        return new LocationsBlock(total, active, byType);
    }

    private List<GrowthPoint> buildCatalogGrowth(UUID companyId, Period period) {

        List<OffsetDateTime> createdAt =
                productRepository.findCreatedAtByCompanyId(companyId);

        LocalDate fromDate = period.from().atZoneSameInstant(ZoneOffset.UTC).toLocalDate();

        long baseline = createdAt.stream()
                .filter(timestamp ->
                        timestamp.atZoneSameInstant(ZoneOffset.UTC)
                                .toLocalDate()
                                .isBefore(fromDate))
                .count();

        Map<LocalDate, Long> perDay = new TreeMap<>();
        for (OffsetDateTime timestamp : createdAt) {
            LocalDate day = timestamp.atZoneSameInstant(ZoneOffset.UTC).toLocalDate();
            if (!day.isBefore(fromDate)) {
                perDay.merge(day, 1L, Long::sum);
            }
        }

        List<GrowthPoint> points = new ArrayList<>();
        long running = baseline;
        for (Map.Entry<LocalDate, Long> entry : perDay.entrySet()) {
            running += entry.getValue();
            points.add(new GrowthPoint(
                    entry.getKey().toString(),
                    entry.getValue(),
                    running));
        }
        return points;
    }

    private List<AttentionItem> buildNeedsAttention(
            ProductsBlock products,
            WarehousesBlock warehouses,
            CountBlock customers,
            CountBlock suppliers
    ) {
        List<AttentionItem> items = new ArrayList<>();

        if (products != null) {
            if (products.missingSellingPrice() > 0) {
                items.add(new AttentionItem(
                        "PRODUCTS_MISSING_PRICE",
                        plural(products.missingSellingPrice(), "product") + " missing a selling price",
                        products.missingSellingPrice(),
                        "warning",
                        "/products"));
            }
            if (products.missingCategory() > 0) {
                items.add(new AttentionItem(
                        "PRODUCTS_MISSING_CATEGORY",
                        plural(products.missingCategory(), "product") + " not assigned to a category",
                        products.missingCategory(),
                        "warning",
                        "/products"));
            }
            if (products.missingBarcode() > 0) {
                items.add(new AttentionItem(
                        "PRODUCTS_MISSING_BARCODE",
                        plural(products.missingBarcode(), "product") + " without a barcode",
                        products.missingBarcode(),
                        "info",
                        "/products"));
            }
        }

        if (warehouses != null) {
            long noLocations = warehouses.byWarehouse().stream()
                    .filter(slice -> slice.locationCount() == 0)
                    .count();
            if (noLocations > 0) {
                items.add(new AttentionItem(
                        "WAREHOUSES_NO_LOCATIONS",
                        plural(noLocations, "warehouse") + " with no locations defined",
                        noLocations,
                        "warning",
                        "/warehouses"));
            }
            if (warehouses.inactive() > 0) {
                items.add(new AttentionItem(
                        "WAREHOUSES_INACTIVE",
                        plural(warehouses.inactive(), "warehouse") + " currently inactive",
                        warehouses.inactive(),
                        "info",
                        "/warehouses"));
            }
        }

        if (customers != null && customers.inactive() > 0) {
            items.add(new AttentionItem(
                    "CUSTOMERS_INACTIVE",
                    plural(customers.inactive(), "customer") + " currently inactive",
                    customers.inactive(),
                    "info",
                    "/customers"));
        }

        if (suppliers != null && suppliers.inactive() > 0) {
            items.add(new AttentionItem(
                    "SUPPLIERS_INACTIVE",
                    plural(suppliers.inactive(), "supplier") + " currently inactive",
                    suppliers.inactive(),
                    "info",
                    "/suppliers"));
        }

        items.sort(Comparator.comparingInt(item -> switch (item.severity()) {
            case "critical" -> 0;
            case "warning" -> 1;
            default -> 2;
        }));

        return items;
    }

    private static String plural(long count, String noun) {
        return count + " " + noun + (count == 1 ? "" : "s");
    }

    private static boolean can(String authority) {
        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }

        for (GrantedAuthority granted : auth.getAuthorities()) {
            if (authority.equals(granted.getAuthority())) {
                return true;
            }
        }
        return false;
    }

    /* ------------------------------------------------------------------ */

    record Period(String key, String label, OffsetDateTime from, OffsetDateTime to) {

        static Period resolve(String rawKey) {
            OffsetDateTime now = OffsetDateTime.now();
            String key = rawKey == null ? "" : rawKey.trim().toUpperCase();

            return switch (key) {
                case "LAST_7_DAYS" -> new Period(key, "Last 7 days", now.minusDays(7), now);
                case "LAST_90_DAYS" -> new Period(key, "Last 90 days", now.minusDays(90), now);
                case "THIS_MONTH" -> new Period(
                        key, "This month",
                        now.withDayOfMonth(1).toLocalDate().atStartOfDay().atOffset(now.getOffset()),
                        now);
                case "THIS_QUARTER" -> {
                    LocalDate quarterStart = now.toLocalDate()
                            .with(IsoFields.DAY_OF_QUARTER, 1L);
                    yield new Period(
                            key, "This quarter",
                            quarterStart.atStartOfDay().atOffset(now.getOffset()),
                            now);
                }
                case "ALL_TIME" -> new Period(
                        key, "All time",
                        OffsetDateTime.of(1970, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC),
                        now);
                default -> new Period("LAST_30_DAYS", "Last 30 days", now.minusDays(30), now);
            };
        }
    }
}
