export type ProductType = "course" | "workshop";

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  type: ProductType;
  imageUrl: string;
  slug: string; // Para la URL amigable: /cursos/amor-propio
}
