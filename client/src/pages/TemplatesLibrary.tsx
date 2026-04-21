import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Download, Search } from "lucide-react";
import { toast } from "sonner";

export default function TemplatesLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState<string>("");
  const [filterSubject, setFilterSubject] = useState<string>("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("");
  const [sortBy, setSortBy] = useState<"popular" | "rated" | "recent">("popular");

  // Fetch templates
  const { data: allTemplates, isLoading: templatesLoading } = trpc.templates.getAll.useQuery();
  const { data: searchResults, isLoading: searchLoading } = trpc.templates.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 2 }
  );

  const useTemplateMutation = trpc.templates.useTemplate.useMutation({
    onSuccess: (data: any) => {
      toast.success("Lesson created from template!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to use template");
    },
  });

  const rateMutation = trpc.templates.rate.useMutation({
    onSuccess: () => {
      toast.success("Rating submitted!");
    },
  });

  // Get unique values for filters
  const classes = useMemo(() => {
    const set = new Set(allTemplates?.map((t: any) => t.class) || []);
    return Array.from(set).sort() as string[];
  }, [allTemplates]);

  const subjects = useMemo(() => {
    let filtered = allTemplates || [];
    if (filterClass) {
      filtered = filtered.filter((t: any) => t.class === filterClass);
    }
    const set = new Set(filtered.map((t: any) => t.subject));
    return Array.from(set).sort() as string[];
  }, [allTemplates, filterClass]);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let templates: any[] = searchQuery.length > 2 ? (searchResults as any[]) : (allTemplates as any[]);
    if (!templates) return [];

    // Apply filters
    templates = templates.filter((t: any) => {
      if (filterClass && t.class !== filterClass) return false;
      if (filterSubject && t.subject !== filterSubject) return false;
      if (filterDifficulty && t.difficulty !== filterDifficulty) return false;
      return true;
    });

    // Sort
    if (sortBy === "popular") {
      templates = [...templates].sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    } else if (sortBy === "rated") {
      templates = [...templates].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return templates;
  }, [allTemplates, searchResults, searchQuery, filterClass, filterSubject, filterDifficulty, sortBy]);

  const isLoading = templatesLoading || searchLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Lesson Templates Library</h1>
          <p className="text-slate-400">
            Browse and use pre-built lessons for CBSE/NCERT curriculum
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6 mb-8">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search templates by title, topic, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="">All Classes</SelectItem>
                {classes.map((cls: string) => (
                  <SelectItem key={cls} value={cls}>
                    Class {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="">All Subjects</SelectItem>
                {subjects.map((subject: string) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="">All Levels</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rated">Top Rated</SelectItem>
                <SelectItem value="recent">Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-800 rounded-lg h-96 animate-pulse"
              />
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">No templates found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template: any) => (
              <Card
                key={template.id}
                className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      {template.toolType}
                    </Badge>
                    <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                      {template.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-white">{template.title}</CardTitle>
                  <CardDescription className="text-slate-400">
                    Class {template.class} • {template.subject}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <p className="text-slate-300 text-sm mb-4">{template.description}</p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      <span>{template.downloads || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{((template.rating as number) || 0).toFixed(1)}</span>
                    </div>
                    <span>{template.estimatedTime} min</span>
                  </div>

                  {/* Tags */}
                  {template.tags && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {template.tags.split(",").map((tag: string, i: number) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="bg-slate-700 text-slate-300 text-xs"
                        >
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => useTemplateMutation.mutate({ templateId: template.id })}
                      disabled={useTemplateMutation.isPending}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {useTemplateMutation.isPending ? "Creating..." : "Use Template"}
                    </Button>
                    <Button
                      onClick={() => rateMutation.mutate({ templateId: template.id, rating: 5 })}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results Count */}
        {!isLoading && (
          <div className="mt-8 text-center text-slate-400">
            Showing {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
