/**
 * NoResults Component
 * Manages the no results message display
 */

export function updateNoResultsMessage(table, show, noResultsClass) {
  let message = document.querySelector(`.${noResultsClass}`);

  if (show && !message) {
    message = document.createElement("div");
    message.className = noResultsClass;
    message.textContent = "No matching results found.";
    table.parentNode.insertBefore(message, table.nextSibling);
  } else if (!show && message) {
    message.remove();
  }
}
