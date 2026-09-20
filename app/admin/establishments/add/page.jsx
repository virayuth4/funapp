"use client";
import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const MAX_IMAGES = 10;
const MAX_VIDEOS = 3;
const SUBMIT_TIMEOUT_MS = 60000;

const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

const emptyHours = () =>
  Object.fromEntries(DAYS.map(({ key }) => [key, { closed: false, open: "", close: "" }]));

function AddEstablishmentForm() {
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("edit") === "true";
  const establishmentId = searchParams.get("id");

  const missingIdError = isEditMode && !establishmentId;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [category, setCategory] = useState("");
  const [branchLocation, setBranchLocation] = useState("");
  const [description, setDescription] = useState("");
  const [map, setMap] = useState("");
  const [accent, setAccent] = useState("");
  const [instagram, setInstagram] = useState("");
  const [isSponsored, setIsSponsored] = useState(false);
  const [inRoll, setInRoll] = useState(true);
  const [cuisine, setCuisine] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [tags, setTags] = useState("");
  const [establishYear, setEstablishYear] = useState("")

  const [logo, setLogo] = useState(null); // { file, previewUrl }
  const [existingLogoUrl, setExistingLogoUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [openingHours, setOpeningHours] = useState(emptyHours);
  

  // Gallery images: a single ordered array mixing existing (already-saved) and
  // new (freshly picked) images, so users can drag to reorder across both.
  // Each item: { id, type: 'existing', url } | { id, type: 'new', file, previewUrl }
  const [images, setImages] = useState([]);
  const [isImagesDragging, setIsImagesDragging] = useState(false);
  const [imagesError, setImagesError] = useState("");
  const imagesInputRef = useRef(null);

  // Reorder drag state (separate from the file-drop drag state above)
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);


  const [videos, setVideos] = useState([]);
  const [isVideosDragging, setIsVideosDragging] = useState(false);
  const [videosError, setVideosError] = useState("");
  const videosInputRef = useRef(null);

  const totalVideoCount = videos.length;
  
  const idCounter = useRef(0);
  function nextId() {
    idCounter.current += 1;
    return `img-${idCounter.current}`;
  }

  const [status, setStatus] = useState(isEditMode && establishmentId ? "loading" : "idle"); // loading | idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState("");

  const totalImageCount = images.length;





  // Auto-generate slug from name until the user edits slug manually
  function generateSlug(text) {
    return text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  // Clean up object URLs on unmount
useEffect(() => {
  return () => {
    if (logo?.previewUrl) URL.revokeObjectURL(logo.previewUrl);
    images.forEach((img) => {
      if (img.type === "new" && img.previewUrl) URL.revokeObjectURL(img.previewUrl);
    });
    videos.forEach((v) => {
      if (v.type === "new" && v.previewUrl) URL.revokeObjectURL(v.previewUrl);
    });
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [logo, images, videos]);

  // Fetch existing establishment data when in edit mode
  useEffect(() => {
    if (!isEditMode || !establishmentId) return;

    let cancelled = false;

    async function loadEstablishment() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/establishment/eatdoko-establishments/${establishmentId}`,
          { method: "GET" }
        );
        const json = await res.json();
        const establishment = json.data;

        if (cancelled) return;
        console.log("establishment data", establishment )

        setName(establishment.name || "");
        setSlug(establishment.slug || "");
        setSlugTouched(true); // don't overwrite a fetched slug with auto-generation
        setCategory(establishment.category || "");
        setBranchLocation(establishment.branch_location || "");
        setDescription(establishment.description || "");
        setMap(establishment.map || "");
        setAccent(establishment.accent || "");
        setInstagram(establishment.instagram || "");
        setIsSponsored(establishment.is_sponsored !== undefined ? Boolean(establishment.is_sponsored) : false);
        setInRoll(establishment.in_roll !== undefined ? Boolean(establishment.in_roll) : true);
        setExistingLogoUrl(establishment.logo_url || "");
        const loadedCuisines = Array.isArray(establishment.cuisines)
          ? establishment.cuisines.join(", ")
          : (establishment.cuisines || "");
        setCuisine(loadedCuisines);
        setPriceRange(establishment.price_range || "");

        const loadedImages = Array.isArray(establishment.image_paths)
          ? establishment.image_paths.map((url) => ({ id: nextId(), type: "existing", url }))
          : [];
        setImages(loadedImages);
        const loadedTags = Array.isArray(establishment.tags)
          ? establishment.tags.join(", ")
          : (establishment.tags || "");
        setTags(loadedTags);

        const loadedHours = emptyHours();
              if (establishment.opening_hours && typeof establishment.opening_hours === "object") {
                DAYS.forEach(({ key }) => {
                  const d = establishment.opening_hours[key];
                  if (d) {
                    loadedHours[key] = {
                      closed: Boolean(d.closed),
                      open: d.open || "",
                      close: d.close || "",
                    };
                  }
                });   
              }
              setOpeningHours(loadedHours);

        const loadedVideos = Array.isArray(establishment.video_urls)
          ? establishment.video_urls.map((url) => ({ id: nextId(), type: "existing", url }))
          : [];
        setVideos(loadedVideos);

        setStatus("idle");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(err.message || "Failed to load establishment for editing.");
      }
    }

    loadEstablishment();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, establishmentId]);

  function updateDay(key, patch) {
  setOpeningHours((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
}

function copyMondayToAll() {
  setOpeningHours((prev) => {
    const next = {};
    DAYS.forEach(({ key }) => {
      next[key] = { ...prev.mon };
    });
    return next;
  });
}

  function addVideoFiles(fileList) {
  const incoming = Array.from(fileList).filter((f) => f.type.startsWith("video/"));
  if (!incoming.length) return;

  const availableSlots = MAX_VIDEOS - totalVideoCount;
  if (availableSlots <= 0) {
    setVideosError(`You can upload up to ${MAX_VIDEOS} videos.`);
    return;
  }

  const accepted = incoming.slice(0, availableSlots);
  if (incoming.length > accepted.length) {
    setVideosError(`Only ${availableSlots} more video${availableSlots === 1 ? "" : "s"} can be added (max ${MAX_VIDEOS}).`);
  } else {
    setVideosError("");
  }

  const withPreviews = accepted.map((file) => ({
    id: nextId(),
    type: "new",
    file,
    previewUrl: URL.createObjectURL(file),
  }));
  setVideos((prev) => [...prev, ...withPreviews]);
}

function removeVideo(id) {
  setVideos((prev) => {
    const target = prev.find((v) => v.id === id);
    if (target?.type === "new" && target.previewUrl) URL.revokeObjectURL(target.previewUrl);
    return prev.filter((v) => v.id !== id);
  });
  setVideosError("");
}

const handleVideosDrop = useCallback((e) => {
  e.preventDefault();
  setIsVideosDragging(false);
  if (e.dataTransfer?.files?.length) {
    addVideoFiles(e.dataTransfer.files);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [videos]);

function handleVideosDragOver(e) {
  e.preventDefault();
  setIsVideosDragging(true);
}

function handleVideosDragLeave(e) {
  e.preventDefault();
  setIsVideosDragging(false);
}

function handleVideosInputChange(e) {
  if (e.target.files?.length) {
    addVideoFiles(e.target.files);
  }
  e.target.value = "";
}

  function addLogoFile(fileList) {
    const file = Array.from(fileList).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    if (logo?.previewUrl) URL.revokeObjectURL(logo.previewUrl);
    setLogo({ file, previewUrl: URL.createObjectURL(file) });
    setExistingLogoUrl(""); // new upload replaces the existing logo
  }

  function removeLogo() {
    if (logo?.previewUrl) URL.revokeObjectURL(logo.previewUrl);
    setLogo(null);
  }

  function removeExistingLogo() {
    setExistingLogoUrl("");
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) {
      addLogoFile(e.dataTransfer.files);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logo]);

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
      addLogoFile(e.target.files);
    }
    e.target.value = "";
  }

  // ---- Gallery image handlers ----
  function addImageFiles(fileList) {
    const incoming = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (!incoming.length) return;

    const availableSlots = MAX_IMAGES - totalImageCount;
    if (availableSlots <= 0) {
      setImagesError(`You can upload up to ${MAX_IMAGES} images.`);
      return;
    }

    const accepted = incoming.slice(0, availableSlots);
    if (incoming.length > accepted.length) {
      setImagesError(`Only ${availableSlots} more image${availableSlots === 1 ? "" : "s"} can be added (max ${MAX_IMAGES}).`);
    } else {
      setImagesError("");
    }

    const withPreviews = accepted.map((file) => ({
      id: nextId(),
      type: "new",
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...withPreviews]);
  }

  function removeImage(id) {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target?.type === "new" && target.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
    setImagesError("");
  }

  const handleImagesDrop = useCallback((e) => {
    e.preventDefault();
    setIsImagesDragging(false);
    if (e.dataTransfer?.files?.length) {
      addImageFiles(e.dataTransfer.files);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  function handleImagesDragOver(e) {
    e.preventDefault();
    setIsImagesDragging(true);
  }

  function handleImagesDragLeave(e) {
    e.preventDefault();
    setIsImagesDragging(false);
  }

  function handleImagesInputChange(e) {
    if (e.target.files?.length) {
      addImageFiles(e.target.files);
    }
    e.target.value = "";
  }

  // ---- Gallery image reorder handlers (drag-and-drop within the grid) ----
  function handleImageDragStart(index) {
    return (e) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = "move";
      // Some browsers require data to be set for the drag to initiate
      e.dataTransfer.setData("text/plain", String(index));
    };
  }

  function handleImageDragEnter(index) {
    return (e) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === index) return;
      setDragOverIndex(index);
    };
  }

  function handleImageDragOverItem(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleImageDropOnItem(index) {
    return (e) => {
      e.preventDefault();
      e.stopPropagation(); // don't also trigger the outer dropzone's onDrop
      if (draggedIndex === null || draggedIndex === index) {
        setDraggedIndex(null);
        setDragOverIndex(null);
        return;
      }
      setImages((prev) => {
        const next = [...prev];
        const [moved] = next.splice(draggedIndex, 1);
        next.splice(index, 0, moved);
        return next;
      });
      setDraggedIndex(null);
      setDragOverIndex(null);
    };
  }

  function handleImageDragEnd() {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  function resetForm() {
    if (logo?.previewUrl) URL.revokeObjectURL(logo.previewUrl);
    images.forEach((img) => {
      if (img.type === "new" && img.previewUrl) URL.revokeObjectURL(img.previewUrl);
    });
    videos.forEach((v) => {
      if (v.type === "new" && v.previewUrl) URL.revokeObjectURL(v.previewUrl);
    });
    for (const { key, label } of DAYS) {
  const d = openingHours[key];
  if (!d.closed && Boolean(d.open) !== Boolean(d.close)) {
    setStatus("error");
    setErrorMessage(`Set both opening and closing time for ${label}, or leave both blank.`);
    return;
  }
}
    setName("");
    setSlug("");
    setSlugTouched(false);
    setCategory("");
    setBranchLocation("");
    setDescription("");
    setMap("");
    setAccent("");
    setInstagram("");
    setIsSponsored(false);
    setInRoll(true);
    setLogo(null);
    setExistingLogoUrl("");
    setImages([]);
    setImagesError("");
    setPriceRange("");
    setTags("");
    setVideos([]);
    setVideosError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("slug", slug.trim());
    const categoryValue = category.trim();
    if (categoryValue) formData.append("category", categoryValue);
    const orderedExistingVideoUrls = videos.filter((v) => v.type === "existing").map((v) => v.url);
    const orderedNewVideoFiles = videos.filter((v) => v.type === "new").map((v) => v.file);
    orderedNewVideoFiles.forEach((file) => formData.append("videos", file));



    if (branchLocation.trim()) formData.append("branch_location", branchLocation.trim());
    if (description.trim()) formData.append("description", description.trim());
    if (map.trim()) formData.append("map", map.trim());
    if (accent.trim()) formData.append("accent", accent.trim());
    if (instagram.trim()) formData.append("instagram", instagram.trim());
    formData.append("is_sponsored", isSponsored);
    formData.append("in_roll", inRoll);
    if (logo?.file) formData.append("logo", logo.file);

    const hasHours = DAYS.some(
  ({ key }) =>
    openingHours[key].closed || (openingHours[key].open && openingHours[key].close)
);
if (hasHours) formData.append("opening_hours", JSON.stringify(openingHours));

    
 const cuisineArray = cuisine
  .split(",")
  .map((c) => c.trim())
  .filter(Boolean);
if (cuisineArray.length) formData.append("cuisine", JSON.stringify(cuisineArray));
    
    

    if (priceRange.trim()) formData.append("price_range", priceRange.trim());
    const tagsArray = tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  if (tagsArray.length) formData.append("tags", JSON.stringify(tagsArray));

  

    // Build the ordered lists the backend needs to reconstruct final order:
    // - orderedExistingUrls: existing image urls, in their current display order
    // - orderedNewFiles: newly picked files, in their current display order
    // - imageOrder: the full interleaved order, referencing each slot by type
    //   ('existing' -> its url, 'new' -> its index within the uploaded files array)
    const orderedExistingUrls = images.filter((i) => i.type === "existing").map((i) => i.url);
    const orderedNewFiles = images.filter((i) => i.type === "new").map((i) => i.file);

    let newFileCounter = 0;
    const imageOrder = images.map((img) => {
      if (img.type === "existing") return { type: "existing", url: img.url };
      const index = newFileCounter++;
      return { type: "new", index };
    });

    orderedNewFiles.forEach((file) => formData.append("images", file));
    formData.append("image_order", JSON.stringify(imageOrder));

    

 if (isEditMode) {
  formData.append("existing_logo_url", existingLogoUrl);
  formData.append("existing_image_paths", JSON.stringify(orderedExistingUrls));
  formData.append("existing_video_urls", JSON.stringify(orderedExistingVideoUrls));
}
 const controller = new AbortController();
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, SUBMIT_TIMEOUT_MS);

    try {
      const url = isEditMode
        ? `${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/establishment/eatdoko-establishments/${establishmentId}`
        : `${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/establishments/add`;

      const res = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        body: formData,
        signal: controller.signal,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error || `Request failed with status ${res.status}`);
      }

      setStatus("success");
      if (!isEditMode) resetForm();
    } catch (err) {
      setStatus("error");
      if (timedOut) {
        setErrorMessage(
          `The request timed out after ${SUBMIT_TIMEOUT_MS / 1000} seconds. Please check your connection and try again.`
        );
      } else {
        setErrorMessage(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
  const isSubmitting = status === "submitting";
  const isLoading = status === "loading";

  const activeError = missingIdError ? "Missing establishment id for edit mode." : errorMessage;
  const isErrorState = status === "error" || missingIdError;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="mx-auto max-w-xl text-sm text-slate-500">Loading establishment…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="mx-auto max-w-xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            {isEditMode ? "Edit establishment" : "Create establishment"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isEditMode
              ? "Update the details below and save your changes."
              : "Fill in the details below to add a new establishment."}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
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
              placeholder="e.g. Ono Cafe | BKK"
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
              placeholder="e.g. ono-cafe-bkk"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
            <p className="mt-1 text-xs text-slate-400">Used in URLs. Auto-generated from name until edited.</p>
          </div>

          {/* Category / Branch location */}
          <div className="grid grid-cols-2 gap-4">
           <div>
  <label htmlFor="category" className="block text-sm font-medium text-slate-700">
    Category
  </label>
  <select
    id="category"
    value={category}
    onChange={(e) => {
      setCategory(e.target.value);
      if (e.target.value !== "Restaurant") setCuisine("");
    }}
    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
  >
    <option value="">Select a category</option>
    <option value="cafe">Cafe</option>
    <option value="bakery">Bakery</option>
      <option value="cafe,bakery">Cafe & Bakery</option>
      <option value="cafe,restaurant">Cafe & Restaurant</option>
         <option value="cafe,bakery,restaurant">Cafe, Bakery & Restaurant</option>
    <option value="restaurant">Restaurant</option>
  </select>
</div>



  <div>
    <label htmlFor="cuisine" className="block text-sm font-medium text-slate-700">
      Cuisine(s)
    </label>
    <input
      id="cuisine"
      type="text"
      value={cuisine}
      onChange={(e) => setCuisine(e.target.value)}
      placeholder="e.g. chinese, taiwanese, pizza, italian"
      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
    />
    <p className="mt-1 text-xs text-slate-400">Separate multiple cuisines with commas.</p>
  </div>

  <div>
              <label htmlFor="branch_location" className="block text-sm font-medium text-slate-700">
                Branch location
              </label>
              <input
                id="branch_location"
                type="text"
                value={branchLocation}
                onChange={(e) => setBranchLocation(e.target.value)}
                placeholder="e.g. BKK"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
  <label htmlFor="tags" className="block text-sm font-medium text-slate-700">
    Tags
  </label>
  <input
    id="tags"
    type="text"
    value={tags}
    onChange={(e) => setTags(e.target.value)}
    placeholder="e.g. vegan-friendly, late-night, outdoor-seating"
    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
  />
  <p className="mt-1 text-xs text-slate-400">Separate multiple tags with commas.</p>
</div>

            <div>
              <label htmlFor="price_range" className="block text-sm font-medium text-slate-700">
                Price Range
              </label>
              <input
                id="price_range"
                type="text"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                placeholder="e.g. 10-15 (must be in this format)"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
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
              placeholder="Describe the establishment"
              className="mt-1.5 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {/* Map link */}
          <div>
            <label htmlFor="map" className="block text-sm font-medium text-slate-700">
              Map link
            </label>
            <input
              id="map"
              type="url"
              value={map}
              onChange={(e) => setMap(e.target.value)}
              placeholder="https://maps.app.goo.gl/..."
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {/* Opening hours */}
<div>
  <div className="flex items-baseline justify-between">
    <label className="block text-sm font-medium text-slate-700">
      Opening hours <span className="text-slate-400 font-normal">(optional)</span>
    </label>
    <button
      type="button"
      onClick={copyMondayToAll}
      className="text-xs font-medium text-slate-500 hover:text-slate-900"
    >
      Copy Monday to all days
    </button>
  </div>

  <div className="mt-1.5 divide-y divide-slate-100 rounded-lg border border-slate-200">
    {DAYS.map(({ key, label }) => {
      const day = openingHours[key];
      return (
        <div key={key} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
          <span className="w-24 text-sm text-slate-700">{label}</span>

          <input
            type="time"
            value={day.open}
            disabled={day.closed}
            onChange={(e) => updateDay(key, { open: e.target.value })}
            aria-label={`${label} opening time`}
            className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
          />
          <span className="text-slate-400">–</span>
          <input
            type="time"
            value={day.close}
            disabled={day.closed}
            onChange={(e) => updateDay(key, { close: e.target.value })}
            aria-label={`${label} closing time`}
            className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
          />

          <label className="ml-auto flex items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={day.closed}
              onChange={(e) => updateDay(key, { closed: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
            />
            Closed
          </label>
        </div>
      );
    })}
  </div>
  <p className="mt-1 text-xs text-slate-400">
    Leave a day blank if unknown. For overnight hours (e.g. 18:00–02:00), set the closing time after midnight.
  </p>
</div>

          {/* Accent / Instagram */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="accent" className="block text-sm font-medium text-slate-700">
                Accent
              </label>
              <input
                id="accent"
                type="text"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                placeholder="e.g. Popular, New"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div>
              <label htmlFor="instagram" className="block text-sm font-medium text-slate-700">
                Instagram <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="instagram"
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@handle or profile URL"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Logo</label>

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

            {(existingLogoUrl || logo) && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {existingLogoUrl && (
                  <div className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200">
                    <img src={existingLogoUrl} alt="Current logo" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeExistingLogo();
                      }}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
                      aria-label="Remove logo"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {logo && (
                  <div className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200">
                    <img src={logo.previewUrl} alt="Logo preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLogo();
                      }}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
                      aria-label="Remove logo"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Gallery images */}
          <div>
            <div className="flex items-baseline justify-between">
              <label className="block text-sm font-medium text-slate-700">Gallery images</label>
              <span className="text-xs text-slate-400">
                {totalImageCount}/{MAX_IMAGES}
              </span>
            </div>

            <div
              onDrop={handleImagesDrop}
              onDragOver={handleImagesDragOver}
              onDragLeave={handleImagesDragLeave}
              onClick={() => totalImageCount < MAX_IMAGES && imagesInputRef.current?.click()}
              className={`mt-1.5 flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition ${
                totalImageCount >= MAX_IMAGES
                  ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                  : isImagesDragging
                  ? "cursor-pointer border-slate-500 bg-slate-50"
                  : "cursor-pointer border-slate-300 hover:border-slate-400"
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
                {totalImageCount >= MAX_IMAGES ? (
                  <span className="font-medium text-slate-500">Maximum of {MAX_IMAGES} images reached</span>
                ) : (
                  <>
                    <span className="font-medium text-slate-900">Click to upload</span> or drag and drop
                  </>
                )}
              </p>
              <p className="mt-1 text-xs text-slate-400">Up to {MAX_IMAGES} images total. PNG, JPG, or WEBP</p>
              <input
                ref={imagesInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagesInputChange}
                className="hidden"
              />
            </div>

            {imagesError && (
              <p className="mt-2 text-xs text-red-600">{imagesError}</p>
            )}

            {images.length > 0 && (
              <>
                <p className="mt-3 text-xs text-slate-400">Drag images to reorder. The first image is used as the cover.</p>
                <div className="mt-1.5 grid grid-cols-4 gap-2">
                  {images.map((img, index) => (
                    <div
                      key={img.id}
                      draggable
                      onDragStart={handleImageDragStart(index)}
                      onDragEnter={handleImageDragEnter(index)}
                      onDragOver={handleImageDragOverItem}
                      onDrop={handleImageDropOnItem(index)}
                      onDragEnd={handleImageDragEnd}
                      className={`group relative aspect-square cursor-grab overflow-hidden rounded-lg border transition active:cursor-grabbing ${
                        dragOverIndex === index
                          ? "border-slate-500 ring-2 ring-slate-300"
                          : "border-slate-200"
                      } ${draggedIndex === index ? "opacity-40" : ""}`}
                    >
                      <img
                        src={img.type === "existing" ? img.url : img.previewUrl}
                        alt="Establishment"
                        className="h-full w-full object-cover"
                        draggable={false}
                      />

                      {/* Drag handle indicator */}
                      <div className="pointer-events-none absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded bg-black/50 text-white opacity-0 transition group-hover:opacity-100">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-3 w-3"
                        >
                          <path d="M9 4a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6-12a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
                        </svg>
                      </div>

                      {index === 0 && (
                        <span className="absolute left-1 bottom-1 rounded bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          Cover
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(img.id);
                        }}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
                        aria-label="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div>
  <div className="flex items-baseline justify-between">
    <label className="block text-sm font-medium text-slate-700">
      Videos <span className="text-slate-400 font-normal">(optional)</span>
    </label>
    <span className="text-xs text-slate-400">
      {totalVideoCount}/{MAX_VIDEOS}
    </span>
  </div>

  <div
    onDrop={handleVideosDrop}
    onDragOver={handleVideosDragOver}
    onDragLeave={handleVideosDragLeave}
    onClick={() => totalVideoCount < MAX_VIDEOS && videosInputRef.current?.click()}
    className={`mt-1.5 flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition ${
      totalVideoCount >= MAX_VIDEOS
        ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
        : isVideosDragging
        ? "cursor-pointer border-slate-500 bg-slate-50"
        : "cursor-pointer border-slate-300 hover:border-slate-400"
    }`}
  >
    <p className="text-sm text-slate-600">
      {totalVideoCount >= MAX_VIDEOS ? (
        <span className="font-medium text-slate-500">Maximum of {MAX_VIDEOS} videos reached</span>
      ) : (
        <>
          <span className="font-medium text-slate-900">Click to upload</span> or drag and drop
        </>
      )}
    </p>
    <p className="mt-1 text-xs text-slate-400">Up to {MAX_VIDEOS} videos total. MP4, MOV, or WEBM</p>
    <input
      ref={videosInputRef}
      type="file"
      accept="video/*"
      multiple
      onChange={handleVideosInputChange}
      className="hidden"
    />
  </div>

  {videosError && <p className="mt-2 text-xs text-red-600">{videosError}</p>}

  {videos.length > 0 && (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {videos.map((v) => (
        <div key={v.id} className="group relative overflow-hidden rounded-lg border border-slate-200">
          <video src={v.type === "existing" ? v.url : v.previewUrl} controls className="h-full w-full" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeVideo(v.id);
            }}
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
            aria-label="Remove video"
          >
            ✕
          </button>
        </div>
      ))}
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
                id="in_roll"
                type="checkbox"
                checked={inRoll}
                onChange={(e) => setInRoll(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
              />
              <label htmlFor="in_roll" className="text-sm font-medium text-slate-700">
                Show in roll
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
              {isEditMode ? "Establishment updated successfully." : "Establishment added successfully."}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || missingIdError}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? isEditMode ? "Saving…" : "Creating establishment…"
              : isEditMode ? "Save changes" : "Create establishment"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function AddEstablishmentPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50 py-12 px-4"><div className="mx-auto max-w-xl text-sm text-slate-500">Loading…</div></main>}>
      <AddEstablishmentForm />
    </Suspense>
  );
}