
let currentUser = null;
let currentType = 'movies'; // Default content type
const API_BASE_URL = 'http://localhost:3000/api';
let selectedRating = 0; // New variable to store the selected rating

// Helper to show/hide pages
function showPage(id) {
  console.log(`Attempting to show page: ${id}`);
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  const pageElement = document.getElementById(id);
  if (pageElement) {
    pageElement.classList.remove('hidden');
    console.log(`Successfully showing page: ${id}`);
  } else {
    console.error(`Page with id '${id}' not found.`);
  }
}
// Add this helper function anywhere in script.js, for example, near the top or before displayReviews.
function renderStars(rating) {
  let starsHtml = '';
  for (let i = 1; i <= 5; i++) {
    // Apply 'filled' class if the current star index is less than or equal to the rating
    starsHtml += `<span class="star-display ${i <= rating ? 'filled' : ''}">&#9733;</span>`;
  }
  return starsHtml;
}

// In the displayReviews function, modify how stars are rendered:
function displayReviews(reviews) {
  // ... (existing code)

  reviews.forEach(review => {
    totalRating += review.rating;
    // ... (existing code)

    // Use the new renderStars helper for individual review display
    reviewElement.innerHTML += `<p>Rating: ${review.rating}/5 ${renderStars(review.rating)}</p>`;
    // ... (existing code)
  });

  const avgRating = reviews.length > 0 ? (totalRating / reviews.length) : 0;
  document.getElementById('average-rating').textContent = avgRating.toFixed(1);

  const averageStarsDiv = document.getElementById('average-stars');
  // Use the new renderStars helper for average rating display
  averageStarsDiv.innerHTML = renderStars(Math.round(avgRating));

  // ... (rest of the displayReviews function)
}

// In the loadReviewPageDetails function, add the line to display the description:
async function loadReviewPageDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get('id');
  const itemType = urlParams.get('type');

  if (itemId && itemType) {
    try {
      const res = await fetch(`${API_BASE_URL}/item/${itemType}/${itemId}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch item details: ${res.status} ${res.statusText}`);
      }
      const item = await res.json();
      console.log("Fetched item details for review page:", item);

      document.getElementById('review-page-title').textContent = item.title;
      document.getElementById('review-item-image').src = item.imageUrl;
      document.getElementById('review-item-image').alt = item.title;
      // ADD THIS LINE: Set the description text content
      document.getElementById('review-item-description').textContent = item.description || 'No description available.';

      // ... (rest of the loadReviewPageDetails function)
    } catch (error) {
      console.error("Error loading review page details:", error);
      document.getElementById('review-page-title').textContent = 'Error loading content';
      document.getElementById('review-item-description').textContent = 'Could not load details for this item.';
    }
  } else {
    document.getElementById('review-page-title').textContent = 'No item selected';
    document.getElementById('review-item-description').textContent = 'Please select an item to view its reviews.';
  }
  document.getElementById('review-section').classList.remove('hidden');
  document.getElementById('item-reviews').classList.remove('hidden');
}

// ... (rest of your script.js content)
// Initialize user status from localStorage on page load
function initializeUser() {
  console.log("Initializing user...");
  const storedUser = localStorage.getItem('currentUser');
  const adminButton = document.getElementById('adminButton'); // Get the admin button

  if (adminButton) {
    adminButton.style.display = 'none'; // Hide by default
  }

  if (storedUser) {
    try {
      currentUser = JSON.parse(storedUser);
      console.log("Current user from localStorage:", currentUser);
      if (document.getElementById('user-info')) {
        document.getElementById('user-info').textContent = `Logged in as ${currentUser.username} (${currentUser.role})`;
      }
      showPage('main'); // Show main content if logged in
      loadContent(); // Load content for the currentType

      // Show admin button if the user is an admin
      if (currentUser.role === 'admin' && adminButton) {
        adminButton.style.display = 'block'; // Or 'inline-block' or 'flex' depending on your layout
      }

    } catch (error) {
      console.error("Error parsing stored user data:", error);
      currentUser = null;
      localStorage.removeItem('currentUser');
      // Redirect to login if parsing failed, as user state is corrupt
      if (!window.location.pathname.endsWith('login.html')) {
        window.location.href = "login.html";
      }
    }
  } else {
    console.log("No current user in localStorage. Redirecting to login.");
    // If not logged in, and not already on login/signup page, redirect.
    if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('signup.html')) {
      window.location.href = "login.html";
    } else if (window.location.pathname.endsWith('index.html')) {
      // If on index.html and not logged in, show the login prompt section.
      showPage('login'); // This 'login' is the section in index.html, not login.html
    }
  }
}

// Ensure rating stars are clickable and update selectedRating
document.addEventListener("DOMContentLoaded", () => {
  const stars = document.querySelectorAll(".rating-input .star");

  stars.forEach((star, index) => {
    // Click to select
    star.addEventListener("click", () => {
      selectedRating = index + 1;
      document.getElementById("review-rating").value = selectedRating;
      updateStarDisplay(stars, selectedRating);
    });

    // Hover effect
    star.addEventListener("mouseenter", () => {
      updateStarDisplay(stars, index + 1);
    });

    // Revert to selected on mouse leave
    star.addEventListener("mouseleave", () => {
      updateStarDisplay(stars, selectedRating);
    });
  });

  function updateStarDisplay(stars, highlightCount) {
    stars.forEach((s, i) => {
      if (i < highlightCount) {
        s.classList.add("selected");
      } else {
        s.classList.remove("selected");
      }
    });
  }
});




// Function to handle login (if used directly in index.html, though login.html is primary)
async function login() {
  // This function might be deprecated if login.html's handelLogin.js is the sole method
  const unameInput = document.getElementById('username'); // Ensure these IDs exist if this form is on index.html
  const passInput = document.getElementById('password');

  if (!unameInput || !passInput) {
    console.error("Username or password input fields not found for inline login.");
    return;
  }

  const uname = unameInput.value;
  const pass = passInput.value;

  try {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: uname, password: pass })
    });

    const data = await res.json();

    if (res.ok) {
      console.log("Login successful from index.html form:", data.user);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      currentUser = data.user;
      if (document.getElementById('user-info')) {
        document.getElementById('user-info').textContent = `Logged in as ${currentUser.username} (${currentUser.role})`;
      }
      showPage('main');
      loadContent();

      // Show admin button if the user is an admin after successful login
      const adminButton = document.getElementById('adminButton');
      if (currentUser.role === 'admin' && adminButton) {
        adminButton.style.display = 'block'; // Or 'inline-block' or 'flex'
      }

    } else {
      console.error("Login failed:", data.message);
      alert("Login failed: " + data.message);
    }
  } catch (error) {
    console.error("Login API error:", error);
    alert("Login failed: " + error.message);
  }
}

function logout() {
  console.log("Logging out user.");
  currentUser = null;
  localStorage.removeItem('currentUser');
  // Hide admin button on logout
  const adminButton = document.getElementById('adminButton');
  if (adminButton) {
    adminButton.style.display = 'none';
  }
  window.location.href = "login.html";
}

function showProfile() {
  if (!currentUser) {
    alert("Please log in to view your profile.");
    window.location.href = "login.html";
    return;
  }
  // Assuming 'user-info' p tag is inside the 'profile' section
  const userInfoP = document.getElementById('user-info');
  if (userInfoP && document.getElementById('profile') && !document.getElementById('profile').contains(userInfoP)) {
    // If 'user-info' is not part of the profile section display, update it specifically for the profile page
    const profileUserInfo = document.getElementById('profile').querySelector('#user-info-profile-page'); // Example: dedicated element
    if (profileUserInfo) profileUserInfo.textContent = `Username: ${currentUser.username}\nRole: ${currentUser.role}`;
    else if (document.getElementById('user-info')) { /* already updated by initializeUser or login */ }

  } else if (document.getElementById('user-info')) {
    // General user-info display, ensure it's up-to-date
    document.getElementById('user-info').textContent = `Logged in as ${currentUser.username} (${currentUser.role})`;
  }
  showPage('profile');
}

function showAdminPanel() {
  if (currentUser && currentUser.role === 'admin') {
    showPage('admin');
    loadAdminPanel();
    loadReportedUsers(); // load reported users
  } else {
    alert("Access denied. Admins only.");
  }
}

// Function to show the Add New Item Form
function showAddItemForm() {
  if (currentUser && currentUser.role === 'admin') {
    showPage('addItemForm'); // Show the form section
    // Clear any previous form data
    document.getElementById('itemType').value = '';
    document.getElementById('itemSection').value = '';
    document.getElementById('itemTitle').value = '';
    document.getElementById('itemImageUrl').value = '';
    document.getElementById('itemDescription').value = '';
  } else {
    alert("Access denied. Admins only.");
  }
}

// Function to cancel adding item and go back to admin panel
function cancelAddItem() {
  showPage('admin'); // Go back to the main admin panel view
  loadAdminPanel(); // Refresh the content structure display
}

// New function to handle form submission for adding an item
async function submitAddItemForm(event) {
  event.preventDefault(); // Prevent default form submission

  if (!currentUser || currentUser.role !== 'admin') {
    alert("Access denied. Admins only.");
    return;
  }

  const type = document.getElementById('itemType').value;
  const section = document.getElementById('itemSection').value;
  const title = document.getElementById('itemTitle').value;
  const imageUrl = document.getElementById('itemImageUrl').value;
  const description = document.getElementById('itemDescription').value; // Get description

  if (!type || !section || !title || !imageUrl) {
    alert("Please fill in all required fields: Type, Section, Title, and Image URL.");
    return;
  }

  console.log(`Admin attempting to add item: Type=${type}, Section=${section}, Title=${title}`);

  try {
    // First, fetch the current content to modify it
    const res = await fetch(`${API_BASE_URL}/content`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status} while fetching current content.`);
    const currentFullContent = await res.json();

    // Ensure the structure exists
    if (!currentFullContent[type]) {
      currentFullContent[type] = { trending: [], recommended: [], upcoming: [] };
    }
    if (!currentFullContent[type][section]) {
      currentFullContent[type][section] = [];
    }

    // Generate a new ID - simple approach, for robustness use UUIDs in a real app
    const newIdSuffix = currentFullContent[type][section].length + 1 + Date.now() % 1000; // Add a bit more uniqueness
    const newItemId = `${type.charAt(0)}${section.charAt(0)}${newIdSuffix}`; // e.g., mt1, br2

    currentFullContent[type][section].push({ id: newItemId, title: title, imageUrl: imageUrl, description: description }); // Added description
    console.log("Updated content structure to be sent:", currentFullContent);

    const updateRes = await fetch(`${API_BASE_URL}/content`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentFullContent) // Send the entire content object back
    });

    if (updateRes.ok) {
      alert("Item added successfully.");
      allContentData = currentFullContent; // Update the cached content data
      showPage('admin'); // Go back to admin panel
      loadAdminPanel(); // Refresh admin panel view
      if (type === currentType) loadContent(); // Reload main content if the added item is of the current view type
    } else {
      const errorData = await updateRes.json().catch(() => ({ message: "Failed to add item due to server error." }));
      console.error("Failed to add item:", errorData.message);
      alert("Failed to add item: " + errorData.message);
    }
  } catch (error) {
    console.error("Error adding item:", error);
    alert("Error adding item: " + error.message);
  }
}


function switchContent(type) {
  console.log(`Switching content to: ${type}`);
  currentType = type;
  const contentTitle = document.getElementById('content-title');
  if (contentTitle) {
    contentTitle.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} `;
  }
  loadContent(); // This calls the async function but doesn't wait for it
  showPage('main'); // This runs immediately after loadContent() is initiated
}

let allContentData = null; // To store the full content data once fetched

async function loadContent() {
  if (!currentUser && !window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('signup.html')) {
    console.log("No user logged in, cannot load main content.");
    // Potentially show a login prompt if on index.html without being logged in
    if (document.getElementById('login') && window.location.pathname.endsWith('index.html')) {
      showPage('login');
    }
    return;
  }

  console.log(`Loading content for type: ${currentType}`);
  try {
    if (!allContentData) { // Fetch only once
      const res = await fetch(`${API_BASE_URL}/content`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status} ${res.statusText}`);
      }
      allContentData = await res.json();
      console.log("Received all content data from API:", allContentData);
    }

    displayContent(allContentData);

  } catch (error) {
    console.error("Error loading content:", error);
    if (document.getElementById('trending')) document.getElementById('trending').innerHTML = `<p class="error-message">Failed to load trending content. ${error.message}</p>`;
    if (document.getElementById('recommended')) document.getElementById('recommended').innerHTML = `<p class="error-message">Failed to load recommended content. ${error.message}</p>`;
    if (document.getElementById('upcoming')) document.getElementById('upcoming').innerHTML = `<p class="error-message">Failed to load upcoming content. ${error.message}</p>`;
  }
}

function displayContent(contentSource, searchTerm = '') {
  const trendingSection = document.getElementById('trending');
  const recommendedSection = document.getElementById('recommended');
  const upcomingSection = document.getElementById('upcoming');

  if (!trendingSection || !recommendedSection || !upcomingSection) {
    console.error("One or more content sections (trending, recommended, upcoming) not found in the DOM.");
    return;
  }

  // Clear previous content
  trendingSection.innerHTML = '';
  recommendedSection.innerHTML = '';
  upcomingSection.innerHTML = '';

  const currentContent = contentSource[currentType];
  const lowerCaseSearchTerm = searchTerm.toLowerCase();

  if (currentContent) {
    console.log(`Processing ${currentType} content for display (search term: '${searchTerm}'):`, currentContent);

    const filterAndAppend = (sectionDiv, itemsArray) => {
      if (itemsArray && Array.isArray(itemsArray)) {
        const filteredItems = itemsArray.filter(item =>
          item.title.toLowerCase().includes(lowerCaseSearchTerm)
        );
        if (filteredItems.length > 0) {
          filteredItems.forEach(item => {
            sectionDiv.appendChild(createContentItem(item, currentType));
          });
        } else if (searchTerm) {
          sectionDiv.innerHTML = `<p>No matching items found.</p>`;
        } else {
          sectionDiv.innerHTML = `<p>No items in this section.</p>`;
        }
      } else {
        console.warn(`No items or invalid format for currentType section.`);
        sectionDiv.innerHTML = `<p>No items in this section.</p>`;
      }
    };

    filterAndAppend(trendingSection, currentContent.trending);
    filterAndAppend(recommendedSection, currentContent.recommended);
    filterAndAppend(upcomingSection, currentContent.upcoming);

  } else {
    console.warn(`No content found for type: ${currentType} in API response.`);
    trendingSection.innerHTML = `<p>No trending ${currentType} found.</p>`;
    recommendedSection.innerHTML = `<p>No recommended ${currentType} found.</p>`;
    upcomingSection.innerHTML = `<p>No upcoming ${currentType} found.</p>`;
  }
}


function createContentItem(item, type) {
  const itemDiv = document.createElement('div');
  itemDiv.className = 'content-item';
  itemDiv.dataset.id = item.id;
  itemDiv.dataset.type = type;

  const img = document.createElement('img');
  img.src = item.imageUrl || 'https://via.placeholder.com/150x220?text=No+Image'; // Fallback image
  img.alt = item.title || 'No title'; // Fallback alt text
  itemDiv.appendChild(img);

  const titleSpan = document.createElement('span');
  titleSpan.textContent = item.title || 'Untitled';
  itemDiv.appendChild(titleSpan);

  itemDiv.addEventListener('click', () => {
    window.location.href = `review.html?id=${item.id}&type=${type}`;
  });

  return itemDiv;
}

//report user
async function reportUser(username) {
  const reason = prompt(`Why are you reporting "${username}"?`);
  if (!reason) return;

  try {
    const res = await fetch(`${API_BASE_URL}/report-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportedUsername: username, reason })
    });

    const data = await res.json();
    alert(data.message);
  } catch (error) {
    alert("Error reporting user: " + error.message);
  }
}


//load reported user
async function loadReportedUsers() {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/reported-users`);
    const reports = await res.json();
    const listContainer = document.getElementById('admin-user-list');

    listContainer.innerHTML = '<h3>Reported Users</h3>';

    if (reports.length === 0) {
      listContainer.innerHTML += '<p>No reported users.</p>';
      return;
    }

    reports.forEach(r => {
      const div = document.createElement('div');
      div.innerHTML = `
        <p><strong>${r.username}</strong> - ${r.reason}</p>
        <button onclick="banUser('${r.username}')">Ban</button>
        <button onclick="suspendUser('${r.username}')">Suspend</button>
        <hr>
      `;
      listContainer.appendChild(div);
    });
  } catch (err) {
    console.error('Error loading reported users:', err);
  }
}

function loadAdminPanel() {
  // existing admin panel loading logic...
  loadReportedUsers(); // ✅ ensure it's called here
}


//ban or suspend user
async function banUser(username) {
  const confirmBan = confirm(`Are you sure you want to ban ${username}?`);
  if (!confirmBan) return;

  const res = await fetch(`${API_BASE_URL}/admin/ban-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameToBan: username, requestedBy: currentUser.username })
  });
  const data = await res.json();
  alert(data.message);
  loadReportedUsers();
}

async function suspendUser(username) {
  const confirmSuspend = confirm(`Suspend ${username}?`);
  if (!confirmSuspend) return;

  const res = await fetch(`${API_BASE_URL}/admin/suspend-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameToSuspend: username, requestedBy: currentUser.username })
  });
  const data = await res.json();
  alert(data.message);
  loadReportedUsers();
}



async function loadReviewPageDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get('id');
  const itemType = urlParams.get('type');

  if (!itemId || !itemType) {
    console.error("Item ID or type not found in URL.");
    return;
  }

  const reviewPageTitle = document.getElementById('review-page-title');
  const itemImage = document.getElementById('review-item-image');
  const itemTitle = document.getElementById('review-item-title');
  const itemDescription = document.getElementById('review-item-description');
  const averageRatingSpan = document.getElementById('average-rating');
  const averageStarsDiv = document.getElementById('average-stars');
  const itemReviewsList = document.getElementById('item-reviews-list');

  try {
    // Fetch all content to find the specific item details
    const contentRes = await fetch(`${API_BASE_URL}/content`);
    const contentData = await contentRes.json();

    let foundItem = null;
    if (contentData[itemType]) {
      for (const category in contentData[itemType]) {
        foundItem = contentData[itemType][category].find(item => item.id === itemId);
        if (foundItem) break;
      }
    }

    if (foundItem) {
      // reviewPageTitle.textContent = `${foundItem.title}`;
      itemImage.src = foundItem.imageUrl;
      itemImage.alt = foundItem.title;
      itemTitle.textContent = foundItem.title;
      itemDescription.textContent = foundItem.description || 'No description available.';
    } else {
      reviewPageTitle.textContent = 'Item Not Found';
      itemDescription.textContent = 'Could not load item details.';
      itemImage.style.display = 'none';
    }

    // Fetch reviews for the specific item
    const reviewsRes = await fetch(`${API_BASE_URL}/reviews/${itemType}/${itemId}`);
    if (!reviewsRes.ok) {
      // Handle the error, e.g., by throwing an error or setting a message
      console.error(`Failed to fetch reviews: ${reviewsRes.status} ${reviewsRes.statusText}`);
      // You might want to display an error message to the user here
      document.getElementById('item-reviews-list').innerHTML = '<p>Failed to load reviews.</p>';
      // Set average rating to N/A or error state
      document.getElementById('average-rating').textContent = 'N/A';
      document.getElementById('average-stars').innerHTML = '';
      // Potentially re-throw or return to stop further processing in this block
      throw new Error(`Failed to fetch reviews: ${reviewsRes.status} ${reviewsRes.statusText}`);
    }
    const itemSpecificReviews = await reviewsRes.json();

    // Calculate average rating
    let totalRating = 0;
    let ratedReviewsCount = 0;
    itemSpecificReviews.forEach(review => {
      if (review.rating && typeof review.rating === 'number') {
        totalRating += review.rating;
        ratedReviewsCount++;
      }
    });

    const averageRating = ratedReviewsCount > 0 ? (totalRating / ratedReviewsCount).toFixed(1) : 'N/A';
    averageRatingSpan.textContent = averageRating;

    // Display average stars
    averageStarsDiv.innerHTML = '';
    if (averageRating !== 'N/A') {
      const fullStars = Math.floor(averageRating);
      const hasHalfStar = averageRating - fullStars >= 0.5;
      for (let i = 0; i < fullStars; i++) {
        const star = document.createElement('span');
        star.classList.add('star-display', 'filled');
        star.innerHTML = '&#9733;';
        averageStarsDiv.appendChild(star);
      }
      if (hasHalfStar) {
        const star = document.createElement('span');
        star.classList.add('star-display', 'half-filled');
        star.innerHTML = '&#9733;'; // Unicode for a star, we'll style it to be half
        averageStarsDiv.appendChild(star);
      }
      for (let i = 0; i < (5 - fullStars - (hasHalfStar ? 1 : 0)); i++) {
        const star = document.createElement('span');
        star.classList.add('star-display');
        star.innerHTML = '&#9733;';
        averageStarsDiv.appendChild(star);
      }
    }


    itemReviewsList.innerHTML = ''; // Clear previous reviews

    if (itemSpecificReviews.length > 0) {
      itemSpecificReviews.forEach(review => {
        const reviewCard = document.createElement('div');
        reviewCard.classList.add('review-card');

        // Create stars for each individual review
        let reviewStarsHtml = '';
        for (let i = 1; i <= 5; i++) {
          reviewStarsHtml += `<span class="star-display ${i <= review.rating ? 'filled' : ''}">&#9733;</span>`;
        }

        reviewCard.innerHTML = `
  <p class="review-user"><strong>${review.user}</strong> on ${new Date(review.timestamp).toLocaleDateString()}</p>
  <div class="review-rating-display">${reviewStarsHtml}</div>
  <p class="review-content">${review.content}</p>
  ${currentUser && currentUser.username !== review.user ? `<button onclick="reportUser('${review.user}')">Report</button>` : ''}
 
`;

        itemReviewsList.appendChild(reviewCard);
        if (currentUser && currentUser.role === 'admin') {
          const deleteButton = document.createElement('button');
          deleteButton.textContent = "Delete";
          deleteButton.onclick = async () => {
            const confirmDelete = confirm("Are you sure you want to delete this review?");
            if (!confirmDelete) return;

            const response = await fetch(`${API_BASE_URL}/reviews/${review.id}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: currentUser.username })
            });

            const result = await response.json();
            alert(result.message);
            loadReviewPageDetails(); // Refresh reviews
          };
          reviewCard.appendChild(deleteButton);
        }

      });
    } else {
      itemReviewsList.innerHTML = '<p>No reviews yet. Be the first to review this item!</p>';
    }

  } catch (error) {
    console.error("Error loading review page details:", error);
    reviewPageTitle.textContent = 'Error Loading Content';
    itemDescription.textContent = 'Failed to load details due to an error.';
  }
}
async function loadReviewsForItem(itemId, itemType) {
  console.log(`Loading reviews for item ID: ${itemId}, type: ${itemType}`);
  try {
    // Corrected fetch call:
    const res = await fetch(`${API_BASE_URL}/reviews/${itemType}/${itemId}`); // Corrected line
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status} ${res.statusText}`);
    }
    const itemSpecificReviews = await res.json(); // Directly get item-specific reviews
    console.log("Filtered reviews for this item:", itemSpecificReviews);

    const itemReviewsDiv = document.getElementById('item-reviews-list');
    itemReviewsDiv.innerHTML = ''; // Clear previous reviews

    if (itemSpecificReviews.length > 0) {
      itemSpecificReviews.forEach(review => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';
        // Create stars for each individual review (similar to loadReviewPageDetails)
        let reviewStarsHtml = '';
        for (let i = 1; i <= 5; i++) {
          reviewStarsHtml += `<span class="star-display ${i <= review.rating ? 'filled' : ''}">&#9733;</span>`;
        }
        // Also, ensure the innerHTML for reviewCard is closed properly.
        reviewCard.innerHTML = `
          <p class="review-user"><strong>${review.user}</strong> on ${new Date(review.timestamp).toLocaleDateString()}</p>
          <div class="review-rating-display">${reviewStarsHtml}</div>
          <p class="review-content">${review.content}</p> 
        `; // Ensure this HTML is complete and correct
        itemReviewsDiv.appendChild(reviewCard);
      });
    } else {
      itemReviewsDiv.innerHTML = '<p>No reviews yet. Be the first to review!</p>';
    }
  } catch (error) {
    console.error("Error loading reviews:", error);
    if (document.getElementById('item-reviews-list')) {
      document.getElementById('item-reviews-list').innerHTML = `<p class="error-message">Failed to load reviews. ${error.message}</p>`;
    }
  }
}

async function submitReview() {
  if (!currentUser) {
    alert("Please log in to submit a review.");
    window.location.href = 'login.html';
    return;
  }

  const reviewInput = document.getElementById('review-input');
  const reviewContent = reviewInput.value.trim();
  const reviewRating = document.getElementById('review-rating').value; // Get the selected rating

  if (!reviewContent) {
    alert("Review content cannot be empty.");
    return;
  }

  if (selectedRating === 0) { // Check if a rating has been selected
    alert("Please select a rating (1-5 stars).");
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get('id');
  const itemType = urlParams.get('type');

  if (!itemId || !itemType) {
    alert("Item ID or type not found in URL.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: currentUser.username,
        content: reviewContent,
        item: itemId,
        type: itemType,
        timestamp: new Date().toISOString(),
        rating: selectedRating // Include the rating
      }),
    });

    if (response.ok) {
      alert("Review submitted successfully!");
      reviewInput.value = ''; // Clear the input field
      selectedRating = 0; // Reset selected rating
      document.getElementById('review-rating').value = 0; // Reset hidden input
      document.querySelectorAll('.rating-input .star').forEach(s => s.classList.remove('selected')); // Clear star display
      loadReviewPageDetails(); // Reload reviews to show the new one and updated average rating
    } else {
      const errorData = await response.json();
      alert("Failed to submit review: " + errorData.message);
    }
  } catch (error) {
    console.error("Error submitting review:", error);
    alert("An error occurred while submitting the review.");
  }
}

function loadAdminPanel() {
  const userListDiv = document.getElementById("admin-user-list");
  const reviewListDiv = document.getElementById("admin-review-list");
  // userListDiv.innerHTML = '<h3>Users</h3>';
  // reviewListDiv.innerHTML = '<h3>Reviews</h3>';

  fetch(`${API_BASE_URL}/users`)
    .then(res => res.json())
    .then(users => {
      users.forEach(user => {
        const div = document.createElement("div");
        div.innerHTML = `${user.username} (${user.role}) <button onclick="banUser('${user.username}')">Ban</button>`;
        userListDiv.appendChild(div);
      });
    });

  fetch(`${API_BASE_URL}/reviews/all`)
    .then(res => res.json())
    .then(reviews => {
      reviews.forEach(review => {
        const div = document.createElement("div");
        div.innerHTML = `Review by <b>${review.user}</b>: ${review.content.substring(0, 50)}... <button onclick="deleteReview('${review.id}')">Delete</button>`;
        reviewListDiv.appendChild(div);
      });
    });
    loadReportedUsers(); // Load reported users
}

// Ban user
function banUser(username) {
  if (!confirm(`Are you sure you want to ban ${username}?`)) return;

  fetch(`${API_BASE_URL}/ban-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      loadAdminPanel();
    });
}

// Delete review
function deleteReview(reviewId) {
  if (!confirm(`Delete review ID ${reviewId}?`)) return;

  fetch(`${API_BASE_URL}/reviews/${reviewId}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      loadAdminPanel();
    });
}

async function performSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchTerm = searchInput.value.trim().toLowerCase();
  console.log("Performing search for:", searchTerm);

  if (!searchTerm) {
    alert("Please enter a search term.");
    return;
  }

  // Ensure content data is loaded
  if (!allContentData) {
    try {
      const res = await fetch(`${API_BASE_URL}/content`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status} ${res.statusText}`);
      }
      allContentData = await res.json();
    } catch (error) {
      console.error("Error fetching content for search:", error);
      alert("Failed to search: Could not load content data.");
      return;
    }
  }

  let foundItem = null;
  let foundItemType = null;

  // Iterate through both 'movies' and 'books' categories
  for (const typeKey in allContentData) {
    if (allContentData.hasOwnProperty(typeKey)) {
      const categories = allContentData[typeKey]; // trending, recommended, upcoming
      for (const categoryKey in categories) {
        if (categories.hasOwnProperty(categoryKey) && Array.isArray(categories[categoryKey])) {
          foundItem = categories[categoryKey].find(item =>
            item.title.toLowerCase().includes(searchTerm)
          );
          if (foundItem) {
            foundItemType = typeKey;
            break; // Found the item, exit inner loop
          }
        }
      }
    }
    if (foundItem) {
      break; // Found the item, exit outer loop
    }
  }

  if (foundItem && foundItemType) {
    console.log("Search item found:", foundItem, "Type:", foundItemType);
    // Redirect to review page for the found item
    window.location.href = `review.html?id=${foundItem.id}&type=${foundItemType}`;
  } else {
    console.log("Search item not found.");
    alert(`"${searchTerm}" not found in our collection of movies or books.`);
  }
}


// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM fully loaded and parsed.");

  // Add event listener for the new item form submission
  const addNewItemForm = document.getElementById('addNewItemForm');
  if (addNewItemForm) {
    addNewItemForm.addEventListener('submit', submitAddItemForm);
  }

  // Always run initializeUser for index.html logic
  if (window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html')) {
    initializeUser();
  }
  // Specific initialization for review.html
  if (window.location.pathname.endsWith('review.html')) {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      currentUser = JSON.parse(storedUser);
      // Also update admin button visibility on review page if user is admin
      const adminButton = document.getElementById('adminButton');
      if (currentUser.role === 'admin' && adminButton) {
        adminButton.style.display = 'block';
      }
    }
    const stars = document.querySelectorAll('.rating-input .star');
    const reviewRatingInput = document.getElementById('review-rating');

    stars.forEach(star => {
      star.addEventListener('click', () => {
        selectedRating = parseInt(star.dataset.value);
        reviewRatingInput.value = selectedRating;
        stars.forEach((s, i) => {
          if (i < selectedRating) {
            s.classList.add('selected');
          } else {
            s.classList.remove('selected');
          }
        });
      });

      star.addEventListener('mouseover', () => {
        stars.forEach((s, i) => {
          if (i < parseInt(star.dataset.value)) {
            s.classList.add('hover');
          } else {
            s.classList.remove('hover');
          }
        });
      });
      // Add this at the bottom of script.js or inside a DOMContentLoaded event
      document.querySelectorAll('.rating-input .star').forEach(star => {
        star.addEventListener('click', () => {
          selectedRating = parseInt(star.getAttribute('data-value'));
          document.getElementById('review-rating').value = selectedRating;

          // Highlight selected stars
          document.querySelectorAll('.rating-input .star').forEach(s => s.classList.remove('selected'));
          for (let i = 0; i < selectedRating; i++) {
            document.querySelectorAll('.rating-input .star')[i].classList.add('selected');
          }
        });
      });

      star.addEventListener('mouseout', () => {
        stars.forEach(s => s.classList.remove('hover'));
      });
    });
    loadReviewPageDetails(); // This needs to run regardless of login to display item.
  }
});