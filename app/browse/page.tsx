import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";

export default function BrowsePage() {
  // Placeholder data - in Phase 4 this will come from database
  const audiobooks = [
    {
      id: 1,
      title: "The Psychology of Money",
      author: "Morgan Housel",
      price: 24.99,
      coverUrl: "/placeholder-cover.jpg",
      categories: ["Finance", "Self-help"],
      description: "Timeless lessons on wealth, greed, and happiness"
    },
    {
      id: 2,
      title: "Atomic Habits",
      author: "James Clear",
      price: 19.99,
      coverUrl: "/placeholder-cover.jpg",
      categories: ["Productivity", "Self-help"],
      description: "An easy & proven way to build good habits"
    },
    {
      id: 3,
      title: "The Midnight Library",
      author: "Matt Haig",
      price: 21.99,
      coverUrl: "/placeholder-cover.jpg",
      categories: ["Fiction", "Philosophy"],
      description: "A novel about all the choices that go into a life lived"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Browse Audiobooks</h1>
          <p className="text-muted-foreground">Discover your next favorite listen from our curated collection</p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search audiobooks, authors..."
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
          <Button variant="outline" className="shrink-0">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {audiobooks.length} audiobooks
          </p>
        </div>

        {/* Audiobooks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {audiobooks.map((book) => (
            <Card key={book.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-4xl">📚</span>
                </div>
                <CardTitle className="text-lg">{book.title}</CardTitle>
                <CardDescription>by {book.author}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {book.description}
                </p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {book.categories.map((category) => (
                    <Badge key={category} variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">${book.price}</span>
                  <Button size="sm">Add to Cart</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {audiobooks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">No audiobooks found</h3>
            <p className="text-muted-foreground">
              Check back soon for new audiobooks or try adjusting your search.
            </p>
          </div>
        )}

        {/* Pagination Placeholder */}
        <div className="flex justify-center mt-12">
          <div className="flex gap-2">
            <Button variant="outline" disabled>Previous</Button>
            <Button variant="outline" className="bg-primary text-primary-foreground">1</Button>
            <Button variant="outline" disabled>Next</Button>
          </div>
        </div>
      </main>
    </div>
  );
}