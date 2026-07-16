import { useSearchParams } from "react-router-dom";
import { PageContainer } from "@/components/common";
import { NavigationPath } from "@/components/navigation";

export function NavigationPage() {
  const [searchParams] = useSearchParams();
  const officeId = searchParams.get("officeId");

  return (
    <PageContainer
      title="Indoor Navigation"
      description="Follow the shortest path from the building entry to your destination."
    >
      <NavigationPath officeId={officeId} />
    </PageContainer>
  );
}
