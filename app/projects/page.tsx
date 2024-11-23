import { DynamicPageWrapper } from '@/components/client/DynamicPageWrapper';
import ProjectsPageClient from '@/components/client/ProjectsPageClient';

export default function Projects() {
  return <DynamicPageWrapper Component={ProjectsPageClient} />;
}
