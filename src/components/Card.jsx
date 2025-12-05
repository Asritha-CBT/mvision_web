export default function Card({ title, children }) {
  return (
    <div className="bg-gray-700 p-4 rounded-xl shadow-lg">
      <h3 className="text-lg font-bold mb-2 font-heading">{title}</h3>
      {children}
    </div>
  );
}