import { Link } from "react-router-dom";
import { PageContainer } from "@/components/common";

export function NotFoundPage() {
  return (
    <PageContainer
      title="Page Not Found"
      description="The page you requested does not exist."
    >
      <Link
        to="/"
        className="inline-flex rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800"
      >
        Back to home
      </Link>
    </PageContainer>
  );
}
