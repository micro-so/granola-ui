"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Plus, UserPlus } from "lucide-react";
import { DockedAsk } from "@/components/ask-bar";
import { ContentColumn, OutlineButton } from "@/components/chrome";
import { GranolaShell } from "@/components/granola-shell";
import { EventRange } from "@/components/note-time";
import { NoteGroups } from "@/components/note-row";
import { noteLeadId, upcomingDayPair, upcomingDays } from "@/lib/data";
import { useUpcoming } from "@/lib/use-upcoming";

export function HomePage() {
  const { items: events, past, live, message } = useUpcoming();
  const days = live ? upcomingDayPair() : upcomingDays;

  return (
    <GranolaShell>
      <div className="relative flex h-full min-h-0 flex-col">
        <div className="absolute right-6 top-4 z-10 flex items-center gap-2">
          <OutlineButton>
            <UserPlus className="h-3.5 w-3.5" strokeWidth={1.75} />
            Invite
          </OutlineButton>
          <OutlineButton>
            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            New note
          </OutlineButton>
        </div>

        <div className="min-h-0 flex-1 overflow-auto pb-28 pt-8 scrollbar-thin">
          <ContentColumn>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-serif text-[32px] font-normal leading-none tracking-[-0.02em] text-heading">
                  Coming up
                </h1>
                {message ? <div className="mt-2 text-[12px] text-muted-foreground">{message}</div> : null}
              </div>
              <div className="flex items-center gap-0.5 text-muted-foreground">
                <button type="button" aria-label="Previous" className="rounded-md p-1 hover:bg-hover hover:text-foreground">
                  <CaretLeft className="h-3.5 w-3.5" />
                </button>
                <button type="button" aria-label="Next" className="rounded-md p-1 hover:bg-hover hover:text-foreground">
                  <CaretRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface/70">
              {days.map((day, index) => {
                const dayEvents = events
                  .filter((event) => event.date === day.date)
                  .sort((left, right) => (left.startsAt ?? left.start).localeCompare(right.startsAt ?? right.start));
                return (
                  <div
                    key={day.date}
                    className={`flex gap-6 px-5 ${index === 0 ? "pt-5 pb-3.5" : "pt-3.5 pb-5"} ${dayEvents.length === 0 ? "items-center" : "items-start"}`}
                    style={
                      index > 0
                        ? {
                            backgroundImage:
                              "repeating-linear-gradient(to right, hsl(var(--border)) 0 5px, transparent 5px 8px)",
                            backgroundSize: "100% 1px",
                            backgroundRepeat: "repeat-x",
                          }
                        : undefined
                    }
                  >
                    <div className="flex w-[132px] shrink-0 items-start gap-3">
                      <div className="font-serif text-[40px] font-normal leading-none text-heading">{day.day}</div>
                      <div className="pt-1.5 text-[12px] leading-4 text-muted-foreground">
                        <div className="flex items-center gap-1.5 text-heading">
                          {day.month}
                          {day.isToday ? <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" /> : null}
                        </div>
                        <div>{day.weekday}</div>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 pt-1">
                      {dayEvents.length === 0 ? (
                        <div className="flex items-center gap-2.5">
                          <span className="h-4 w-[3px] shrink-0 rounded-full bg-muted-foreground/55" />
                          <div className="text-[13px] text-muted-foreground">
                            {day.isToday ? "No more events today" : "No events"}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3.5">
                          {dayEvents.map((event) => (
                            <div key={event.id} className="flex gap-2.5">
                              {event.solo ? (
                                <span className="mt-1 h-8 w-[3px] shrink-0" />
                              ) : (
                                <span
                                  className="mt-1 h-8 w-[3px] shrink-0 rounded-full"
                                  style={{ background: event.color }}
                                />
                              )}
                              <div className="min-w-0">
                                <div
                                  className={`truncate text-[14px] ${event.solo ? "text-muted-foreground" : "text-heading"}`}
                                >
                                  {event.title}
                                </div>
                                <div className="text-[12.5px] text-muted-foreground">
                                  <EventRange start={event.start} end={event.end} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10">
              <NoteGroups
                notes={past}
                names="first"
                showAddTo
                sectionClassName="mb-7"
                hrefForNote={(note) => `/people/${noteLeadId(note)}`}
              />
            </div>
          </ContentColumn>
        </div>

        <DockedAsk />
      </div>
    </GranolaShell>
  );
}
