import { PageContainer } from "@/components/common";
import { SearchForm } from "@/components/search";

export function SearchPage() {
  return (
    <PageContainer
      title="Search Campus"
      description="Search offices, room numbers, staff, and aliases."
    >
      <SearchForm />
    </PageContainer>
  );
}
