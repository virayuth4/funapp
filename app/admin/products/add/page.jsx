"use client";
import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// ---------------------------------------------------------------------------
// Category / subcategory config
// This is the single place that needs to grow when you add Food, Activities,
// etc. Each category maps to a list of subcategories shown as a dropdown.
// If a category has no subcategories defined yet (e.g. Food, Activities),
// the form falls back to a free-text input so it's still usable before you've
// filled in the list.
// ---------------------------------------------------------------------------
const CATEGORY_CONFIG = {
  Drinks: {
    label: "Drinks",
    subcategories: [
      "Latte",
      "Mocha",
      "Matcha",
      "Americano",
      "Cappuccino",
      "Espresso",
      "Tea",
      "Smoothie",
      "Chocolate",
      "Other",
    ],
  },
  Food: {
    label: "Food",
    subcategories: [], // fill in when you're ready, e.g. ["Sandwich", "Pastry", "Salad"]
  },
  // Activities: { label: "Activities", subcategories: [] },
};

const CATEGORIES = Object.keys(CATEGORY_CONFIG);

function AddProductForm() {
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("edit") === "true";
  const productId = searchParams.get("id");

  const missingIdError = isEditMode && !productId;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [shopId, setShopId] = useState("");
  const [category, setCategory] = useState("Drinks");
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [grabLink, setGrabLink] = useState("");
  const [foodpandaLink, setFoodpandaLink] = useState("");
  const [isSponsored, setIsSponsored] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  const [image, setImage] = useState(null); // { file, previewUrl }
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [shops, setShops] = useState([]);
  const [shopsStatus, setShopsStatus] = useState("loading"); // loading | idle | error

  const [status, setStatus] = useState(isEditMode && productId ? "loading" : "idle"); // loading | idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState("");

  const activeSubcategories = CATEGORY_CONFIG[category]?.subcategories || [];
  const hasSubcategoryList = activeSubcategories.length > 0;

  function generateSlug(text) {
    return text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);

  // Reset subcategory whenever category changes, since the valid options differ
  useEffect(() => {
    setSubcategory("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // Fetch shops for the dropdown
  useEffect(() => {
    let cancelled = false;

    async function loadShops() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/establishments`, {
          method: "GET",
        });
        const json = await res.json();
        if (cancelled) return;
        setShops(Array.isArray(json.data) ? json.data : []);
        setShopsStatus("idle");
      } catch (err) {
        if (cancelled) return;
        setShopsStatus("error");
      }
    }

    loadShops();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch existing product data when in edit mode
  useEffect(() => {
    if (!isEditMode || !productId) return;

    let cancelled = false;

    async function loadProduct() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/products/eatdoko-products/${productId}`,
          { method: "GET" }
        );
        const json = await res.json();
        const product = json.data;

        if (cancelled) return;

        setName(product.name || "");
        setSlug(product.slug || "");
        setSlugTouched(true); // don't overwrite a fetched slug with auto-generation
        setShopId(product.shop_id !== undefined && product.shop_id !== null ? String(product.shop_id) : "");
        setCategory(product.category && CATEGORY_CONFIG[product.category] ? product.category : "Drinks");
        setSubcategory(product.subcategory || "");
        setDescription(product.description || "");
        setPrice(product.price !== undefined && product.price !== null ? String(product.price) : "");
        setGrabLink(product.grab_link || "");
        setFoodpandaLink(product.foodpanda_link || "");
        setIsSponsored(product.is_sponsored !== undefined ? Boolean(product.is_sponsored) : false);
        setIsAvailable(product.is_available !== undefined ? Boolean(product.is_available) : true);
        setExistingImageUrl(product.image_url || "");

        setStatus("idle");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(err.message || "Failed to load product for editing.");
      }
    }

    loadProduct();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, productId]);

  function addImageFile(fileList) {
    const file = Array.from(fileList).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
    setImage({ file, previewUrl: URL.createObjectURL(file) });
    setExistingImageUrl(""); // new upload replaces the existing image
  }

  function removeImage() {
    if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
    setImage(null);
  }

  function removeExistingImage() {
    setExistingImageUrl("");
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) {
      addImageFile(e.dataTransfer.files);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleFileInputChange(e) {
    if (e.target.files?.length) {
      addImageFile(e.target.files);
    }
    e.target.value = "";
  }

  function resetForm() {
    if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
    setName("");
    setSlug("");
    setSlugTouched(false);
    setShopId("");
    setCategory("Drinks");
    setSubcategory("");
    setDescription("");
    setPrice("");
    setGrabLink("");
    setFoodpandaLink("");
    setIsSponsored(false);
    setIsAvailable(true);
    setImage(null);
    setExistingImageUrl("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("slug", slug.trim());
    formData.append("shop_id", shopId);
    formData.append("category", category);
    if (subcategory.trim()) formData.append("subcategory", subcategory.trim());
    if (description.trim()) formData.append("description", description.trim());
    if (price !== "") formData.append("price", price);
    if (grabLink.trim()) formData.append("grab_link", grabLink.trim());
    if (foodpandaLink.trim()) formData.append("foodpanda_link", foodpandaLink.trim());
    formData.append("is_sponsored", isSponsored);
    formData.append("is_available", isAvailable);
    if (image?.file) formData.append("image", image.file);

    if (isEditMode) {
      formData.append("existing_image_url", existingImageUrl);
    }

    try {
      const url = isEditMode
        ? `${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/products/eatdoko-products/${productId}`
        : `${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/products/add`;

      const res = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        body: formData,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error || `Request failed with status ${res.status}`);
      }

      setStatus("success");
      if (!isEditMode) resetForm();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err.message || "Something went wrong. Please try again.");
    }
  }

  const isSubmitting = status === "submitting";
  const isLoading = status === "loading";

  const activeError = missingIdError ? "Missing product id for edit mode." : errorMessage;
  const isErrorState = status === "error" || missingIdError;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="mx-auto max-w-xl text-sm text-slate-500">Loading product…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="mx-auto max-w-xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            {isEditMode ? "Edit product" : "Create product"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isEditMode
              ? "Update the details below and save your changes."
              : "Fill in the details below to add a new product."}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {/* Shop */}
          <div>
            <label htmlFor="shop_id" className="block text-sm font-medium text-slate-700">
              Shop
            </label>
            <select
              id="shop_id"
              required
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              disabled={shopsStatus === "loading"}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
            >
              <option value="" disabled>
                {shopsStatus === "loading" ? "Loading shops…" : "Select a shop"}
              </option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
            {shopsStatus === "error" && (
              <p className="mt-1 text-xs text-red-600">Couldn't load shops. Try refreshing the page.</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => {
                const newName = e.target.value;
                setName(newName);
                if (!slugTouched) {
                  setSlug(generateSlug(newName));
                }
              }}
              placeholder="e.g. Iced Matcha Latte"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-slate-700">
              Slug
            </label>
            <input
              id="slug"
              type="text"
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="e.g. iced-matcha-latte"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
            <p className="mt-1 text-xs text-slate-400">Used in URLs. Auto-generated from name until edited.</p>
          </div>

          {/* Category / Subcategory */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                {CATEGORIES.map((key) => (
                  <option key={key} value={key}>
                    {CATEGORY_CONFIG[key].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="subcategory" className="block text-sm font-medium text-slate-700">
                Subcategory
              </label>
              {hasSubcategoryList ? (
                <select
                  id="subcategory"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">Select…</option>
                  {activeSubcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="subcategory"
                  type="text"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder="No preset list yet — type one"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the product"
              className="mt-1.5 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-slate-700">
              Price
            </label>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 3.50"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {/* Delivery links */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="grab_link" className="block text-sm font-medium text-slate-700">
                Grab link <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="grab_link"
                type="url"
                value={grabLink}
                onChange={(e) => setGrabLink(e.target.value)}
                placeholder="https://food.grab.com/..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div>
              <label htmlFor="foodpanda_link" className="block text-sm font-medium text-slate-700">
                Foodpanda link <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="foodpanda_link"
                type="url"
                value={foodpandaLink}
                onChange={(e) => setFoodpandaLink(e.target.value)}
                placeholder="https://foodpanda.com/..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Image</label>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition ${
                isDragging
                  ? "border-slate-500 bg-slate-50"
                  : "border-slate-300 hover:border-slate-400"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="mb-2 h-8 w-8 text-slate-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 8.25L12 3.75m0 0L7.5 8.25M12 3.75v12"
                />
              </svg>
              <p className="text-sm text-slate-600">
                <span className="font-medium text-slate-900">Click to upload</span> or drag and drop
              </p>
              <p className="mt-1 text-xs text-slate-400">PNG, JPG, or WEBP</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {(existingImageUrl || image) && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {existingImageUrl && (
                  <div className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200">
                    <img src={existingImageUrl} alt="Current product image" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeExistingImage();
                      }}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
                      aria-label="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {image && (
                  <div className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200">
                    <img src={image.previewUrl} alt="Product image preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage();
                      }}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
                      aria-label="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                id="is_sponsored"
                type="checkbox"
                checked={isSponsored}
                onChange={(e) => setIsSponsored(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
              />
              <label htmlFor="is_sponsored" className="text-sm font-medium text-slate-700">
                Sponsored
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="is_available"
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
              />
              <label htmlFor="is_available" className="text-sm font-medium text-slate-700">
                Available
              </label>
            </div>
          </div>

          {/* Status messages */}
          {isErrorState && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {activeError}
            </p>
          )}
          {status === "success" && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              {isEditMode ? "Product updated successfully." : "Product added successfully."}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || missingIdError}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? isEditMode ? "Saving…" : "Creating product…"
              : isEditMode ? "Save changes" : "Create product"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function AddProductPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50 py-12 px-4"><div className="mx-auto max-w-xl text-sm text-slate-500">Loading…</div></main>}>
      <AddProductForm />
    </Suspense>
  );
}