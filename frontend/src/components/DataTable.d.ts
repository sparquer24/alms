declare module '../components/DataTable' {
    import React from 'react';

    interface DataTableProps {
        data: any[]; 
        onRowClick: () => void; // Add this prop

    }

    const DataTable: React.FC<DataTableProps>;

    export default DataTable;
}
