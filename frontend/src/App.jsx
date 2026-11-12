
import { useState, useEffect } from "react";
import "./App.css";

// Restaurants are loaded from SQLite through FastAPI.
const API_URL = "http://localhost:8000";

const emptyForm = {
  name: "",
  address: "",
  cuisine: "",
  jFood: "",
  jVibe: "",
  lFood: "",
  lVibe: "",
  note: "",
};

// Shih Tzu rating icon
function Rating({ value }) {
  return (
    <div className="rating">
      <img src="/shih_tzu.png" alt="Shih Tzu" />
      <span>{value.toFixed(1)}</span>
    </div>
  );
}

// Gold, silver, and bronze cards
function PodiumCard({ restaurant }) {
  return (
    <div className={`podium-card rank-${restaurant.rank}`}>
      <div className="podium-top">
        <span className="rank-label">
          {restaurant.rank === 1 ? "🏆" : "🏅"}
          {" "}#{restaurant.rank}
        </span>

        <Rating value={restaurant.rating} />
      </div>

      <div className="podium-info">
        <h3>{restaurant.name}</h3>
        <p>{restaurant.address}</p>
      </div>
    </div>
  );
}

// Regular ranking cards
function RestaurantCard({ restaurant }) {
  return (
    <div className="restaurant-card">
      <div className="rank-number">
        #{restaurant.rank}
      </div>

      <div className="restaurant-info">
        <h3>{restaurant.name}</h3>
        <p>{restaurant.address}</p>
        <small>{restaurant.cuisine}</small>
      </div>

      <Rating value={restaurant.rating} />
    </div>
  );
}

function App() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [cuisine, setCuisine] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Stop background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  // Close modal with Escape
  useEffect(() => {
    if (!showModal) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setShowModal(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showModal]);

  // Update a form field
  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  // Close modal
  function closeModal() {
    setShowModal(false);
  }


  // Load database records and show errors rather than hiding failures.
  async function fetchRestaurants() {
    const response = await fetch(`${API_URL}/ratings`);
    if (!response.ok) {
      throw new Error(`Could not load restaurants (${response.status})`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("Unexpected response from the API");
    }
    setRestaurants(data);
    setError("");
  }

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/ratings`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Could not load restaurants (${response.status})`);
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Unexpected response from the API");
        if (active) setRestaurants(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  // Add restaurant

  async function addRestaurant(e) {
    e.preventDefault();
  
    const ratings = [
      form.jFood,
      form.jVibe,
      form.lFood,
      form.lVibe
    ];
  
    const validRatings = ratings.every(
      (value) =>
        value.trim() !== "" &&
        Number.isFinite(Number(value)) &&
        Number(value) >= 0 &&
        Number(value) <= 10
    );
  
    if (
      !form.name.trim() ||
      !form.address.trim() ||
      !form.cuisine.trim() ||
      !validRatings
    ) {
      alert("Enter all required fields and ratings from 0 to 10.");
      return;
    }
  
    // These names match your SQLite columns
    const restaurantData = {
      restaurant_name: form.name.trim(),
      address: form.address.trim(),
      cuisine: form.cuisine.trim(),
  
      j_food_rating: Number(form.jFood),
      j_vibe_rating: Number(form.jVibe),
  
      l_food_rating: Number(form.lFood),
      l_vibe_rating: Number(form.lVibe),
  
      note: form.note || ""
    };
  
    try {
      setSaving(true);
      setError("");
  
      const response = await fetch(
        `${API_URL}/ratings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(restaurantData)
        }
      );
  
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Failed to save restaurant (${response.status}): ${detail}`);
      }
  
      // SQLite has now saved the restaurant
      // and calculated the generated ratings
  
      // Saved rows include SQLite-generated ovr_rating.
      // If refresh fails, retain the form to avoid losing the entry.
      await fetchRestaurants();
  
      setForm({ ...emptyForm });
      setShowModal(false);
  
    } catch (err) {
      setError(err.message);
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  }
  

  // SQLite is responsible for calculating overall ratings.
  // Map database column names to the fields used by the existing cards.
  const ranked = [...restaurants]
    .sort((a, b) => b.ovr_rating - a.ovr_rating || a.rating_id - b.rating_id)
    .map((restaurant, index) => ({
      ...restaurant,
      id: restaurant.rating_id,
      name: restaurant.restaurant_name,
      rating: Number(restaurant.ovr_rating),
      rank: index + 1,
    }));

  const cuisines = [
    "All",
    ...new Set(restaurants.map((r) => r.cuisine).filter(Boolean)),
  ];

  const filtered = ranked.filter((restaurant) => {
    const matchesSearch = restaurant.name
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const matchesCuisine = cuisine === "All" || restaurant.cuisine === cuisine;
    return matchesSearch && matchesCuisine;
  });

  const showPodium = search.trim() === "" && cuisine === "All";

  return (
    <div className="app">

      {/* HEADER */}
      <header>
        <span className="eyebrow">
          OUR FOOD JOURNAL
        </span>

        <h1>Justin + Lily's Ratings</h1>

        <p>Food spots we're rating together.</p>
      </header>

      {/* SEARCH + CUISINE FILTER */}
      <div className="filters">
        <input
          type="search"
          placeholder="Search restaurants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={cuisine}
          onChange={(e) => setCuisine(e.target.value)}
          aria-label="Filter by cuisine"
        >
          {cuisines.map((c) => (
            <option key={c} value={c}>
              {c === "All" ? "All cuisines" : c}
            </option>
          ))}
        </select>
      </div>

      {loading && <p role="status">Loading restaurants...</p>}
      {error && <p role="alert" style={{ color: "#aa385c" }}>{error}</p>}

      {/* TOP THREE */}
      {showPodium && ranked.length > 0 && (
        <section>
          <h2>Top Restaurants</h2>

          <div className="podium-stacked">

            {/* GOLD */}
            <PodiumCard restaurant={ranked[0]} />

            {/* SILVER + BRONZE */}
            <div className="podium-bottom">
              {ranked.slice(1, 3).map((restaurant) => (
                <PodiumCard
                  key={restaurant.id}
                  restaurant={restaurant}
                />
              ))}
            </div>

          </div>
        </section>
      )}

      {/* ALL RANKINGS */}
      <section className="rankings">
        <div className="section-header">
          <h2>
            {showPodium
              ? "All Rankings"
              : "Search Results"}
          </h2>

          <span>{filtered.length} places</span>
        </div>

        {filtered
          .filter((restaurant) => !showPodium || restaurant.rank > 3)
          .map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
            />
          ))}

        {!loading && !error && filtered.length === 0 && (
          <p className="empty">
            No restaurants found.
          </p>
        )}
      </section>

      {/* FLOATING ADD BUTTON */}
      <button
        type="button"
        className="add-button"
        onClick={() => setShowModal(true)}
        aria-label="Add restaurant"
      >
        +
      </button>

      {/* ADD RESTAURANT MODAL */}
      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >

            {/* MODAL HEADER */}
            <div className="modal-header">
              <h2 id="modal-title">
                Add Restaurant
              </h2>

              <button
                type="button"
                className="close-button"
                onClick={closeModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={addRestaurant}>

              {/* RESTAURANT NAME */}
              <div className="form-field">
                <label htmlFor="restaurant-name">
                  Name
                </label>

                <input
                  id="restaurant-name"
                  type="text"
                  placeholder="Restaurant name"
                  value={form.name}
                  onChange={(e) =>
                    updateField("name", e.target.value)
                  }
                  required
                />
              </div>

              {/* LOCATION */}
              <div className="form-field">
                <label htmlFor="restaurant-address">
                  Location
                </label>

                <input
                  id="restaurant-address"
                  type="text"
                  placeholder="Restaurant address"
                  value={form.address}
                  onChange={(e) =>
                    updateField("address", e.target.value)
                  }
                  required
                />
              </div>

              {/* CUISINE */}
              <div className="form-field">
                <label htmlFor="restaurant-cuisine">
                  Cuisine
                </label>

                <select
                  id="restaurant-cuisine"
                  value={form.cuisine}
                  onChange={(e) =>
                    updateField("cuisine", e.target.value)
                  }
                  required
                >
                  <option value="">
                    Select cuisine
                  </option>

                  {[
                    "American",
                    "Chinese",
                    "Italian",
                    "Japanese",
                    "Korean",
                    "Mexican",
                    "Thai",
                    "Vietnamese",
                    "Other"
                  ].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* OPTIONAL NOTES */}
              <div className="form-field">
                <label htmlFor="restaurant-note">Notes (optional)</label>
                <textarea
                  id="restaurant-note"
                  placeholder="What did you think?"
                  value={form.note}
                  onChange={(e) => updateField("note", e.target.value)}
                  rows={2}
                />
              </div>

              {/* JUSTIN + LILY RATINGS */}
              <div className="rating-divider">

                {/* JUSTIN */}
                <div className="person-rating justin-rating">
                  <h3>Justin</h3>

                  <div className="form-field">
                    <label htmlFor="j-food">
                      Food
                    </label>

                    <input
                      id="j-food"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      placeholder="0–10"
                      value={form.jFood}
                      onChange={(e) =>
                        updateField("jFood", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="j-vibe">
                      Vibe
                    </label>

                    <input
                      id="j-vibe"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      placeholder="0–10"
                      value={form.jVibe}
                      onChange={(e) =>
                        updateField("jVibe", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                {/* LILY */}
                <div className="person-rating lily-rating">
                  <h3>Lily</h3>

                  <div className="form-field">
                    <label htmlFor="l-food">
                      Food
                    </label>

                    <input
                      id="l-food"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      placeholder="0–10"
                      value={form.lFood}
                      onChange={(e) =>
                        updateField("lFood", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="l-vibe">
                      Vibe
                    </label>

                    <input
                      id="l-vibe"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      placeholder="0–10"
                      value={form.lVibe}
                      onChange={(e) =>
                        updateField("lVibe", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>

              </div>

              {/* SAVE BUTTON */}
              <button
                type="submit"
                className="submit-button"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Restaurant"}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
