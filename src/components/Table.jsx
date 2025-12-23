export default function Table({ columns, data }) {
  	const noData = !data || data.length === 0;

	return (
		<table className="w-full table-auto border-collapse border border-[rgb(124_157_204/23%)]">
			<thead>
				<tr>
					{columns.map((col) => (
						<th
							key={col}
							className="border border-[rgb(124_157_204/23%)] px-4 py-2 text-left"
							>
							{col}
						</th>
					))}
				</tr>
			</thead>

			<tbody>
				{noData ? (
					<tr>
						<td
							colSpan={columns.length}
							className="text-center py-6 text-gray-400"
							>
							No data found
						</td>
					</tr>
				) : (
					data.map((row, idx) => (
						<tr key={idx} className="hover:bg-gray-800">
							{row.map((cell, cIdx) => (
								<td
									key={cIdx}
									className="border border-[rgb(124_157_204/23%)] px-4 py-2"
									>
									{cell}
								</td>
							))}
						</tr>
					))
				)}
			</tbody>
		</table>
	);
}
