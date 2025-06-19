import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Upload } from "lucide-react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const pollFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  options: z.array(z.string().min(1)).min(2, "At least 2 options required"),
  isAnonymous: z.boolean().default(true),
  allowMultiple: z.boolean().default(false),
});

type PollFormData = z.infer<typeof pollFormSchema>;

export default function PollForm() {
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [eligibleVoters, setEligibleVoters] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PollFormData>({
    resolver: zodResolver(pollFormSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      options: ["", ""],
      isAnonymous: true,
      allowMultiple: false,
    },
  });

  const createPollMutation = useMutation({
    mutationFn: async (data: PollFormData & { eligibleVoters: string[] }) => {
      const response = await apiRequest("POST", "/api/polls", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Poll created successfully",
      });
      form.reset();
      setOptions(["", ""]);
      setEligibleVoters([]);
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create poll",
        variant: "destructive",
      });
    },
  });

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const emails = lines
          .map(line => line.trim())
          .filter(line => line && line.includes('@'));
        setEligibleVoters(emails);
        toast({
          title: "CSV Uploaded",
          description: `${emails.length} eligible voters loaded`,
        });
      };
      reader.readAsText(file);
    }
  };

  const onSubmit = (data: PollFormData) => {
    const validOptions = options.filter(option => option.trim());
    if (validOptions.length < 2) {
      toast({
        title: "Error",
        description: "At least 2 options are required",
        variant: "destructive",
      });
      return;
    }

    if (eligibleVoters.length === 0) {
      toast({
        title: "Error",
        description: "Please upload a CSV file with eligible voters",
        variant: "destructive",
      });
      return;
    }

    createPollMutation.mutate({
      ...data,
      options: validOptions,
      eligibleVoters,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Poll</CardTitle>
        <p className="text-sm text-muted-foreground">Set up a new transparent election or poll</p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poll Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter poll title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={3}
                      placeholder="Describe the poll purpose and context"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel>Poll Options</FormLabel>
              <div className="mt-2 space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      disabled={options.length <= 2}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addOption}
                className="mt-2 text-primary hover:text-primary/80"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Option
              </Button>
            </div>

            <div>
              <FormLabel>Eligible Voters</FormLabel>
              <div className="mt-2">
                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="csv-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/80">
                        <span>Upload CSV file</span>
                        <input
                          id="csv-upload"
                          type="file"
                          accept=".csv"
                          className="sr-only"
                          onChange={handleCsvUpload}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      CSV file with voter emails (max 10MB)
                      {eligibleVoters.length > 0 && ` - ${eligibleVoters.length} voters loaded`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <FormField
                control={form.control}
                name="isAnonymous"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Anonymous voting</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allowMultiple"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Allow multiple selections</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline">
                Save Draft
              </Button>
              <Button type="submit" disabled={createPollMutation.isPending}>
                {createPollMutation.isPending ? "Creating..." : "Create Poll"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
