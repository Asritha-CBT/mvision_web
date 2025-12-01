export default function Table({ columns, data }) {
  return (
    <table className="w-full table-auto border-collapse border border-gray-700">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col} className="border border-gray-700 px-4 py-2 text-left">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx} className="hover:bg-gray-800">
            {row.map((cell, cIdx) => (
              <td key={cIdx} className="border border-gray-700 px-4 py-2">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
