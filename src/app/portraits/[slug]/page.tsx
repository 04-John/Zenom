import { ArtworkDetail, artworkMetadata } from "@/components/product/ArtworkDetail";

export const dynamic = "force-dynamic";

export const generateMetadata = ({ params }: { params: { slug: string } }) => artworkMetadata(params.slug);

export default function PortraitDetailPage({ params }: { params: { slug: string } }) {
  return <ArtworkDetail slug={params.slug} section="portraits" />;
}
