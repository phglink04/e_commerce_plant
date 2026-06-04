"use client";

import { useEffect, useState } from "react";
import Image, { type ImageLoaderProps } from "next/image";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { extractIdFromSlugAndId, buildSlugAndId } from "@/lib/slug.utils";
import { useAuthStore } from "@/store/auth-store";
import { useHomeUiStore } from "@/store/home-ui-store";
import ReviewSection from "@/components/reviews/ReviewSection";
import "@/components/reviews/reviews.css";

type Plant = {
  _id: string;
  slug: string;
  id?: string;
  name: string;
  price: number;
  salePrice?: number;
  imageCover: string;
  category: string;
  tags: string[];
  availability: "In Stock" | "Out Of Stock" | "Up Coming";
  description: string;
  stock: number;
  discountPercentage?: number;
  isFeatured?: boolean;
  isFlashSale?: boolean;
  rating?: number;
};

interface PlantDetailPageProps {
  params: Promise<{ plantId: string }>;
}

const passthroughLoader = ({ src }: ImageLoaderProps) => src;

export default function PlantDetailPage({ params }: PlantDetailPageProps) {
  const router = useRouter();
  const { token } = useAuthStore();

  const [plant, setPlant] = useState<Plant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState("1");
  const [slugAndId, setSlugAndId] = useState<string | null>(null);

  // Resolve params
  useEffect(() => {
    params.then((resolved) => {
      setSlugAndId(resolved.plantId);
    });
  }, [params]);

  // Fetch plant details
  useEffect(() => {
    if (!slugAndId) return;

    const fetchPlant = async () => {
      try {
        setIsLoading(true);
        setError("");

        // Extract ID from slug+ID format
        // If extraction fails, treat entire param as ID (backward compatibility)
        const id = extractIdFromSlugAndId(slugAndId) || slugAndId;

        const response = await api.get(`/api/plants/${slugAndId}`);
        const plantData = response.data?.data?.plant || response.data?.data;

        if (!plantData || !plantData._id) {
          setError("Cây xanh không tồn tại");
          setTimeout(() => router.push("/shop"), 2000);
          return;
        }

        // Check if redirect is needed (slug mismatch)
        if (response.data?._redirect) {
          router.replace(response.data._redirect);
          return;
        }

        setPlant(plantData);
        if (plantData.stock === 0 || plantData.availability === "Out Of Stock") {
          setQuantity(0);
          setQuantityInput("0");
        } else {
          setQuantity(1);
          setQuantityInput("1");
        }
      } catch (err) {
        const errorMsg =
          typeof err === "object" && err && "response" in err
            ? ((err as { response?: { data?: { message?: string } } }).response
                ?.data?.message ?? "Unable to load plant details.")
            : "Unable to load plant details.";
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlant();
  }, [slugAndId, router]);

  const maxQty = plant?.stock ?? 1;

  const handleAddToCart = async () => {
    setCartMessage("");

    if (!token) {
      setCartMessage("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      return;
    }

    if (!plant) {
      setCartMessage("Sản phẩm không khả dụng.");
      return;
    }

    // Parse and validate input value first
    let val = parseInt(quantityInput, 10);
    if (isNaN(val) || val <= 0) {
      val = 1;
    } else if (val > maxQty) {
      val = maxQty;
    }
    setQuantity(val);
    setQuantityInput(String(val));

    if (val <= 0 || val > maxQty) {
      setCartMessage(`Số lượng phải từ 1 đến ${maxQty}.`);
      return;
    }

    try {
      const response = await api.post(
        "/api/users/addtocart",
        {
          plantId: plant._id,
          quantity,
          price: plant.salePrice ?? plant.price,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      // Update cart count immediately from response
      const cart = response.data?.data?.cart ?? [];
      if (cart && Array.isArray(cart)) {
        const state = useHomeUiStore.getState();
        state.setCartCount(cart.length);
      }
      setCartMessage(`Đã thêm "${plant.name}" (SL: ${quantity}) vào giỏ hàng!`);
      setQuantity(1);
    } catch (err) {
      const message =
        typeof err === "object" && err && "response" in err
          ? ((err as { response?: { data?: { message?: string } } }).response
              ?.data?.message ?? "Thêm vào giỏ hàng thất bại.")
          : "Thêm vào giỏ hàng thất bại.";
      setCartMessage(message);
    }
  };

  if (isLoading) {
    return (
      <main className="container py-12">
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <p className="text-gray-600">Đang tải thông tin sản phẩm...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !plant) {
    return (
      <main className="container py-12">
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <p className="text-red-600 font-semibold">
              {error || "Sản phẩm không tồn tại"}
            </p>
            <p className="text-gray-600 mt-2">Đang chuyển hướng sang cửa hàng...</p>
          </div>
        </div>
      </main>
    );
  }

  const discountedPrice = plant.salePrice ?? plant.price;

  const outOfStock = plant.availability === "Out Of Stock";

  return (
    <main className="container py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="flex justify-center">
          <div className="relative w-full aspect-square max-w-lg bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={plant.imageCover}
              alt={plant.name}
              fill
              className="object-cover"
              loader={passthroughLoader}
              priority
            />
            {plant.isFlashSale && (
              <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded font-bold">
                Sale
              </div>
            )}
            {plant.isFeatured && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded font-bold">
                Nổi bật
              </div>
            )}
            {outOfStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  Hết hàng
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="flex flex-col justify-start">
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {plant.name}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-3 mb-6">
            {plant.tags?.map((t) => (
              <span key={t} className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-medium">
                {t}
              </span>
            ))}
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm font-medium">
              {plant.category}
            </span>
            <span
              className={`px-3 py-1 rounded text-sm font-medium ${
                plant.availability === "In Stock"
                  ? "bg-green-100 text-green-700"
                  : plant.availability === "Out Of Stock"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {plant.availability}
            </span>
          </div>

          {/* Stock Info */}
          {plant.stock !== undefined && (
            <p className="text-sm text-gray-600 mb-4">
              {plant.stock > 0 ? `Còn ${plant.stock} sản phẩm trong kho` : "Hết hàng"}
            </p>
          )}

          {/* Rating */}
          {plant.rating !== undefined && plant.rating > 0 && (
            <p className="text-sm text-gray-600 mb-4">
              ⭐ Đánh giá: {plant.rating.toFixed(1)}
            </p>
          )}

          {/* Price */}
          <div className="mb-6">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-green-600">
                {discountedPrice.toLocaleString("vi-VN")}đ
              </span>
              {plant.discountPercentage && plant.discountPercentage > 0 && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    {plant.price.toLocaleString("vi-VN")}đ
                  </span>
                  <span className="text-lg text-red-600 font-bold">
                    -{plant.discountPercentage}%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          {plant.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Mô tả sản phẩm
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {plant.description}
              </p>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="flex gap-4 mb-6">
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => {
                  const nextVal = Math.max(1, quantity - 1);
                  setQuantity(nextVal);
                  setQuantityInput(String(nextVal));
                }}
                disabled={outOfStock || quantity <= 1}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={maxQty}
                value={quantityInput}
                onChange={(e) => {
                  setQuantityInput(e.target.value);
                }}
                onBlur={() => {
                  let val = parseInt(quantityInput, 10);
                  if (isNaN(val) || val <= 0) {
                    val = 1;
                  } else if (val > maxQty) {
                    val = maxQty;
                  }
                  setQuantity(val);
                  setQuantityInput(String(val));
                }}
                disabled={outOfStock}
                className="w-16 text-center border-x border-gray-300 py-2 focus:outline-none disabled:bg-gray-100"
              />
              <button
                onClick={() => {
                  const nextVal = Math.min(maxQty, quantity + 1);
                  setQuantity(nextVal);
                  setQuantityInput(String(nextVal));
                }}
                disabled={outOfStock || quantity >= maxQty}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition-colors"
            >
              {outOfStock ? "Hết hàng" : "🛒 Thêm vào giỏ hàng"}
            </button>
          </div>

          {/* Messages */}
          {cartMessage && (
            <div
              className={`p-4 rounded-lg text-sm font-medium ${
                cartMessage.includes("Đã thêm")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {cartMessage}
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      {plant._id && <ReviewSection productId={plant._id} />}
    </main>
  );
}
