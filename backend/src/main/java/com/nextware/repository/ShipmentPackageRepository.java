package com.nextware.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public class ShipmentPackageRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public void addPackage(
            UUID shipmentId,
            UUID packageId
    ) {
        entityManager.createNativeQuery(
                """
                INSERT INTO shipment_package
                    (shipment_id, package_id)
                VALUES
                    (:shipmentId, :packageId)
                """
        )
        .setParameter("shipmentId", shipmentId)
        .setParameter("packageId", packageId)
        .executeUpdate();
    }

    public List<UUID> findPackageIdsByShipmentId(
            UUID shipmentId
    ) {
        return entityManager.createNativeQuery(
                """
                SELECT package_id
                FROM shipment_package
                WHERE shipment_id = :shipmentId
                ORDER BY created_at ASC
                """
        )
        .setParameter("shipmentId", shipmentId)
        .getResultList();
    }
}