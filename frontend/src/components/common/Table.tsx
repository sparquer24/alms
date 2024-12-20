import React from 'react';

type TableProps = {
  headers: string[];
  data: Record<string, any>[];
  onRowSelect: (row: Record<string, any>) => void;
};

const Table: React.FC<TableProps> = ({ headers, data, onRowSelect }) => {
  return (
    <table className="min-w-full bg-white">
      <thead>
        <tr className="bg-gray-200">
          <th className="p-2">
            <input type="checkbox" />
          </th>
          {headers.map((header, index) => (
            <th key={index} className="p-2">{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr
            key={index}
            className={`text-center ${index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}`}
          >
            <td>
              <input type="checkbox" onChange={() => onRowSelect(row)} />
            </td>
            {Object.values(row).map((value, i) => (
              <td key={i} className="p-2">{value}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;