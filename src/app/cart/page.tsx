import { OrderBag } from "@/components/cart/OrderBag";

export const metadata = { title: "Order Bag | Zenom Studio" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 lg:px-10">
      <h1 className="font-display text-4xl text-navy">My Order</h1>
      <div className="mt-10">
        <OrderBag />
      </div>
    </div>
  );
}
