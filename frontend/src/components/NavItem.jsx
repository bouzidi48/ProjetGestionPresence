const NavItem = ({ icon, label, active, onClick, collapsed }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 mb-2 rounded transition ${
      active ? 'bg-blue-700' : 'hover:bg-blue-800'
    }`}
  >
    {icon}
    {!collapsed && <span>{label}</span>}
  </button>
);
export default NavItem;