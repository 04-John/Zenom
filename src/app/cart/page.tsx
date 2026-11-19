import { OrderBag } from "@/components/cart/OrderBag";
import { MobileBag } from "@/components/cart/MobileBag";

export const metadata = { title: "Order Bag | Zenom Studio" };

// Below 900px the bag and checkout are one screen (MobileBag, also used by
// /checkout). From 900px the desktop bag is unchanged.
export default function CartPage() {
  return (
    <>
      <div className="min-[900px]:hidden">
        <MobileBag />
      </div>
      <div className="max-[900px]:hidden">
        <OrderBag />
      </div>
    </>
  );
}
