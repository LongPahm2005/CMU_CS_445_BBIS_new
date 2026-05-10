export default function ProtectedRoute({ children }) {
  // Bỏ qua kiểm tra auth vì chưa có backend
  return <>{children}</>;
}
