import Image from "next/image";
import { notFound } from "next/navigation";
import { mockPlants } from "@/lib/mock-content";

type PlantDetailPageProps = {
  params: Promise<{ plantId: string }>;
};

export function generateStaticParams() {
  return mockPlants.map((plant) => ({ plantId: plant.id }));
}

export default async function PlantDetailPage({
  params,
}: PlantDetailPageProps) {
  const { plantId } = await params;
  const plant = mockPlants.find((item) => item.id === plantId);

  if (!plant) {
    notFound();
  }

  return (
    <main className="container pw-plant-detail">
      <Image
        src={plant.image}
        alt={plant.name}
        width={880}
        height={520}
        className="pw-plant-cover"
      />
      <h1>{plant.name}</h1>
      <p className="pw-plant-short">{plant.shortDescription}</p>
      <div className="pw-plant-meta">
        <span>Price: {plant.price} VND</span>
        <span>Category: {plant.category}</span>
        <span>Type: {plant.tag}</span>
        <span>Availability: {plant.availability}</span>
      </div>
      <p className="pw-plant-desc">{plant.description}</p>
    </main>
  );
}
