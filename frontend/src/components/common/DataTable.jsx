import React, {useState} from "react";
import "../../styles/Datatable.css"
import {
  useTable,
  usePagination,
  useSortBy,
  useGlobalFilter,
} from "react-table";

const DataTable = ({ data, columns, isPagination, isSearch }) => {
  const [pageSize, setPageSize] = useState(10);
  // Define columns
  
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    rows,
    prepareRow,
    gotoPage,
    canPreviousPage,
    canNextPage,
    pageOptions,
    previousPage,
    nextPage,
    setGlobalFilter,
    setPageSize: setTablePageSize,
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize },
    },
    isSearch ? useGlobalFilter : () => {},
    isPagination ? usePagination : () => {},
    useSortBy
  );
  const [searchText, setSearchText] =  useState('');

  const TableHeader = () => {
    return(
      <thead>
        {headerGroups.map((headerGroup, index) => (
          <tr key={index} {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th key={column.id} {...column.getHeaderProps()}>{column.render('Header')}</th>
            ))}
          </tr>
        ))}
      </thead>
    )};

  const TableBody = () => (
    <tbody {...getTableBodyProps()}>
        {(isPagination ? page : rows)?.map(row => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map(cell => (
                <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
  );

  const handlePageSizeChange = (event) => {
    const size = Number(event.target.value);
    setPageSize(size);
    setTablePageSize(size);
    gotoPage(0);
  };

  const handleSearch = (event) => {
    setSearchText(event.target.value);
    setGlobalFilter(event.target.value);
  }

  return (
    <div className="table-wrapper">
      <div className="data-table-top">
      {
        isPagination && (
          <div className="data-table-show">
          <select value={pageSize} onChange={handlePageSizeChange}>
              {[10, 20, 30, 40, 50].map((size) => (
                  <option key={size} value={size}>
                      Show {size}
                  </option>
              ))}
          </select>
          </div>
        )
      }
      {
        isSearch && (
          <div className="data-table-search">
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={handleSearch}
            />
          </div>
        )
      }
      </div>

      <table className="data-table" {...getTableProps()}>
        <TableHeader />
        <TableBody />
      </table>
      {isPagination && <div className="data-table-pagination">
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          First
        </button>
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          Prev
        </button>
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          Next
        </button>
        <button
          onClick={() => gotoPage(pageOptions.length - 1)}
          disabled={!canNextPage}
        >
          Last
        </button>
      </div>}
    </div>
  );
};

export default DataTable;
