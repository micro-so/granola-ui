"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Plus, SquareSlash, UserPlus } from "lucide-react";
import { AskField } from "@/components/ask-bar";
import { ContentColumn, MutedAction, OutlineButton } from "@/components/chrome";
import { GranolaShell } from "@/components/granola-shell";
import { EventRange } from "@/components/note-time";
import { NoteGroups } from "@/components/note-row";
import { eventsForDate, noteLeadId, notes, upcomingDays } from "@/lib/data";

export function HomePage() {
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
              <h1 className="font-serif text-[32px] font-normal leading-none tracking-[-0.02em] text-heading">
                Coming up
              </h1>
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
              {upcomingDays.map((day, index) => {
                const dayEvents = eventsForDate(day.date);
                return (
                  <div
                    key={day.date}
                    className={`flex gap-6 px-5 py-5 ${index > 0 ? "border-t border-border" : ""}`}
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
                        <div className="text-[13px] text-muted-foreground">No more events today</div>
                      ) : (
                        <div className="flex flex-col gap-3.5">
                          {dayEvents.map((event) => (
                            <div key={event.id} className="flex gap-2.5">
                              <span
                                className="mt-1 h-8 w-[3px] shrink-0 rounded-full"
                                style={{ background: event.color }}
                              />
                              <div className="min-w-0">
                                <div className="truncate text-[14px] text-heading">{event.title}</div>
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
                notes={notes}
                names="first"
                showAddTo
                sectionClassName="mb-7"
                hrefForNote={(note) => `/people/${noteLeadId(note)}`}
              />
            </div>
          </ContentColumn>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center px-6">
          <AskField
            placeholder="Ask anything"
            className="pointer-events-auto w-full max-w-[720px] shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
          >
            <MutedAction className="h-9 gap-2 px-3.5 text-[13px] text-heading">
              <SquareSlash className="h-3.5 w-3.5" strokeWidth={1.75} />
              List recent todos
            </MutedAction>
          </AskField>
        </div>
      </div>
    </GranolaShell>
  );
}
