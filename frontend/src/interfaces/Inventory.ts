export interface InventoryTracker {
    updated_quantity: string,
    inventory_id: string,
    reference_number: string,
    old_quantity: string,
    created_by: string,
    changed_type: string,
    id: string
}

export interface Inventory {
    category: string,
    available_quantity: string,
    item_name: string,
    district_id: string,
    id: string,
    store_id: string,
    tracker: InventoryTracker[]
}