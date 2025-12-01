export default function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded shadow-lg w-96">
        <button
          onClick={onClose}
          className="text-white float-right text-xl font-bold"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}
