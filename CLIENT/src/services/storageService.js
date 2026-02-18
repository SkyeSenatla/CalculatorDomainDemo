// storageService.js — The Service Layer for data persistence.
// Separating data-fetching/storage logic into a service keeps components
// and hooks clean. If we later switch from localStorage to a real API,
// we only need to update this file — nothing else changes.

const STORAGE_KEY = "calculations";

const storageService = {
  // Retrieves all saved calculations from localStorage.
  // Returns an empty array if nothing is stored yet.
  getCalculations() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Saves the full calculations array to localStorage as a JSON string.
  saveCalculations(calculations) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(calculations));
  },
};

export default storageService;
