import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, CheckCircle, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/contacts")({
  component: AdminContactsPage,
});

type ContactMessage = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  message: string;
  status: "unread" | "read" | "archived";
  rating?: number | null;
};

function AdminContactsPage() {
  const qc = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["admin_contact_messages"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "42P01") return [];
        throw error;
      }
      return (data ?? []) as unknown as ContactMessage[];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("contact_messages")
        .update({ status: "read" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Marked as read");
      qc.invalidateQueries({ queryKey: ["admin_contact_messages"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("contact_messages" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Message deleted");
      qc.invalidateQueries({ queryKey: ["admin_contact_messages"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="p-8">Loading messages...</div>;
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">
            Contact Messages
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage inquiries from your contact form.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {messages?.length === 0 ? (
          <div className="rounded border border-dashed border-border p-12 text-center text-muted-foreground">
            No messages yet. (Make sure you ran the SQL script to create the
            table!)
          </div>
        ) : (
          messages?.map((msg) => (
            <div
              key={msg.id}
              className={`rounded border border-border p-5 sm:p-6 transition-colors ${msg.status === "unread" ? "bg-accent/5 border-accent/20" : "bg-card"}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    {msg.status === "unread" && (
                      <span
                        className="h-2 w-2 rounded-full bg-accent"
                        title="Unread"
                      />
                    )}
                    <h3 className="font-medium">{msg.name}</h3>
                    {msg.rating && (
                      <span className="flex items-center text-accent ml-2 text-sm">
                        {"★".repeat(msg.rating)}
                        {"☆".repeat(5 - msg.rating)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-muted-foreground text-sm flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <a
                        href={`mailto:${msg.email}`}
                        className="hover:underline"
                      >
                        {msg.email}
                      </a>
                    </span>
                    <span className="text-xs text-muted-foreground border-l border-border pl-3">
                      {formatDate(msg.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {msg.status === "unread" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markRead.mutate(msg.id)}
                      disabled={markRead.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1.5" />
                      Mark read
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => deleteMessage.mutate(msg.id)}
                    disabled={deleteMessage.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 text-sm whitespace-pre-wrap p-4 bg-secondary/30 rounded border border-border/50">
                {msg.message}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
