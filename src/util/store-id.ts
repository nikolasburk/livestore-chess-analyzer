export const getStoreId = (userEmail?: string | null) => {
  if (typeof window === 'undefined') return 'unused'

  // If user is authenticated, transform their email to a valid storeId
  if (userEmail) {
    // Convert email to valid storeId format: replace @ with - and . with -
    // e.g., "nikolas.burk@gmail.com" -> "nikolas-burk-gmail-com"
    return userEmail.replace(/@/g, '-').replace(/\./g, '-')
  }

  return crypto.randomUUID()
}
