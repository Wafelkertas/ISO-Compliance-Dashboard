export function getPaginationPages(currentPage: number, totalPages: number) {
    const pages: (number | string)[] = [];

    // If total pages <=7, show all pages
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
        return pages;
    }

    // Always show first page
    pages.push(1);

    // Show left ellipsis
    if (currentPage > 3) {
        pages.push("...");
    }

    // Middle pages block
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    // Show right ellipsis
    if (currentPage < totalPages - 2) {
        pages.push("...");
    }

    // Always show last page
    pages.push(totalPages);

    return pages;
}