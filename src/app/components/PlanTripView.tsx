'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { InterestOption, Place, TripPreferences } from '@/lib/schema';

interface PlanTripViewProps {
  destination: string;
  setDestination: (destination: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  travelPace: string;
  setTravelPace: (pace: string) => void;
  interests: string[];
  preferences: TripPreferences;
  setPreferences: (preferences: TripPreferences) => void;
  interestOptions: InterestOption[];
  toggleInterest: (id: string) => void;
  selectedPlaces: Place[];
  removePlace: (id: number | string) => void;
  createTrip: () => void;
  setIsCreatingTrip: (isCreating: boolean) => void;
  setActiveTab: (tab: string) => void;
}

interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
}

const steps = [
  { id: 1, label: 'Trip basics', description: 'Where and when' },
  { id: 2, label: 'Your travel style', description: 'Budget and interests' },
  { id: 3, label: 'Build your plan', description: 'Stay, needs, and places' }
];

const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

export default function PlanTripView({
  destination,
  setDestination,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  travelPace,
  setTravelPace,
  interests,
  preferences,
  setPreferences,
  interestOptions,
  toggleInterest,
  selectedPlaces,
  removePlace,
  createTrip,
  setIsCreatingTrip,
  setActiveTab
}: PlanTripViewProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const basicsComplete = Boolean(destination && startDate && endDate && endDate >= startDate);
  const tripDays = useMemo(() => {
    if (!startDate || !endDate || endDate < startDate) return 0;
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);
    return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  }, [startDate, endDate]);

  const updatePreferences = (update: Partial<TripPreferences>) => {
    setPreferences({ ...preferences, ...update });
  };

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (currentStep === 1 && destination.trim().length >= 3) {
      debounceTimeout.current = setTimeout(async () => {
        setIsLoadingSuggestions(true);
        try {
          const response = await fetch(`/api/places?query=${encodeURIComponent(destination.trim())}`);
          if (!response.ok) throw new Error(`Places request failed with ${response.status}`);
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Unable to load destination suggestions:', error);
          setSuggestions([]);
        } finally {
          setIsLoadingSuggestions(false);
        }
      }, 700);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [currentStep, destination]);

  useEffect(() => {
    const closeSuggestions = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', closeSuggestions);
    return () => document.removeEventListener('mousedown', closeSuggestions);
  }, []);

  const selectSuggestion = (suggestion: PlaceSuggestion) => {
    setDestination(suggestion.description);
    setShowSuggestions(false);
  };

  const cancelPlanning = () => {
    setIsCreatingTrip(false);
    setActiveTab('dashboard');
  };

  const goToStep = (step: number) => {
    if (step === 1 || basicsComplete) setCurrentStep(step);
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 px-6 py-8 text-white shadow-xl sm:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Free smart planner
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Plan the trip, not the spreadsheet.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">Tell TravelEase what matters, choose a few places, and get a practical day-by-day itinerary you can still edit.</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-200">Your progress</div>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-2 w-40 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${(currentStep / 3) * 100}%` }} />
              </div>
              <span className="text-sm font-semibold">Step {currentStep} of 3</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <nav className="grid border-b border-slate-200 bg-slate-50/80 md:grid-cols-3" aria-label="Trip planning steps">
            {steps.map(step => {
              const active = currentStep === step.id;
              const completed = currentStep > step.id;
              const available = step.id === 1 || basicsComplete;
              return (
                <button key={step.id} type="button" onClick={() => goToStep(step.id)} disabled={!available} className={`flex items-center gap-3 border-b-2 px-5 py-4 text-left transition md:border-b-0 md:border-r-2 md:last:border-r-0 ${active ? 'border-blue-600 bg-white text-blue-700 md:border-blue-600' : 'border-transparent text-slate-500 hover:bg-white disabled:cursor-not-allowed disabled:opacity-45'}`}>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${active ? 'bg-blue-600 text-white' : completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{completed ? '✓' : step.id}</span>
                  <span><span className="block text-sm font-semibold">{step.label}</span><span className="block text-xs text-slate-400">{step.description}</span></span>
                </button>
              );
            })}
          </nav>

          <div className="p-6 sm:p-8">
            {currentStep === 1 && (
              <div className="space-y-7">
                <StepHeader step="STEP 1" title="Where are you going?" description="Start with the essentials. You can change everything later." />

                <div className="relative" ref={suggestionRef}>
                  <label htmlFor="destination" className="mb-2 block text-sm font-semibold text-slate-700">Destination</label>
                  <div className="relative">
                    <svg className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                    <input id="destination" value={destination} onChange={event => setDestination(event.target.value)} onFocus={() => suggestions.length > 0 && setShowSuggestions(true)} className={`${fieldClass} pl-12`} placeholder="Try Tokyo, Lisbon, or Banff" autoComplete="off" />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">Suggestions begin after 3 characters to reduce API usage.</p>
                  {showSuggestions && (
                    <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                      {isLoadingSuggestions ? <div className="px-4 py-5 text-sm text-slate-500">Finding destinations…</div> : suggestions.length > 0 ? suggestions.map(suggestion => (
                        <button key={suggestion.placeId} type="button" onClick={() => selectSuggestion(suggestion)} className="flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left hover:bg-blue-50">
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                          <span><span className="block font-semibold text-slate-800">{suggestion.mainText}</span><span className="block text-sm text-slate-500">{suggestion.secondaryText}</span></span>
                        </button>
                      )) : <div className="px-4 py-5 text-sm text-slate-500">No destinations found. Try a nearby major city.</div>}
                    </div>
                  )}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Start date"><input id="startDate" type="date" value={startDate} onChange={event => setStartDate(event.target.value)} className={fieldClass} /></Field>
                  <Field label="End date"><input id="endDate" type="date" min={startDate || undefined} value={endDate} onChange={event => setEndDate(event.target.value)} className={fieldClass} /></Field>
                </div>
                {startDate && endDate && endDate < startDate && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">The end date must be on or after the start date.</p>}

                <div>
                  <div className="mb-3 flex items-center justify-between"><label className="text-sm font-semibold text-slate-700">Travel pace</label><span className="text-xs text-slate-400">Controls stops per day</span></div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { id: 'relaxed', label: 'Relaxed', detail: 'About 2 stops/day', icon: '☕' },
                      { id: 'balanced', label: 'Balanced', detail: 'About 3 stops/day', icon: '⚖️' },
                      { id: 'packed', label: 'Packed', detail: 'About 4 stops/day', icon: '⚡' }
                    ].map(pace => (
                      <button key={pace.id} type="button" onClick={() => setTravelPace(pace.id)} className={`rounded-2xl border p-4 text-left transition ${travelPace === pace.id ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-100' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                        <span className="text-xl">{pace.icon}</span><span className="mt-2 block font-semibold text-slate-800">{pace.label}</span><span className="block text-xs text-slate-500">{pace.detail}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-7">
                <StepHeader step="STEP 2" title="Make it feel like your trip" description="Budget and interests help rank places. They never trigger a paid AI call." />
                <div className="grid gap-5 sm:grid-cols-[1fr_150px_150px]">
                  <Field label="Total trip budget" hint="optional"><input id="budget" type="number" min="0" step="25" value={preferences.budget ?? ''} onChange={event => updatePreferences({ budget: event.target.value ? Number(event.target.value) : undefined })} className={fieldClass} placeholder="e.g. 1500" /></Field>
                  <Field label="Currency"><select id="currency" value={preferences.currency} onChange={event => updatePreferences({ currency: event.target.value })} className={fieldClass}>{['USD', 'CAD', 'EUR', 'GBP', 'JPY', 'AUD'].map(currency => <option key={currency}>{currency}</option>)}</select></Field>
                  <Field label="Travelers"><input id="travelers" type="number" min="1" max="20" value={preferences.travelers} onChange={event => updatePreferences({ travelers: Math.max(1, Number(event.target.value) || 1) })} className={fieldClass} /></Field>
                </div>

                <div>
                  <div className="mb-3"><h3 className="text-sm font-semibold text-slate-700">What are you into?</h3><p className="mt-1 text-xs text-slate-400">Pick as many as you like.</p></div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {interestOptions.map(option => {
                      const selected = interests.includes(option.id);
                      return <button key={option.id} type="button" onClick={() => toggleInterest(option.id)} className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${selected ? 'border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-200' : 'border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'}`}>{option.label}<span className={`ml-2 flex h-5 w-5 items-center justify-center rounded-full text-xs ${selected ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-400'}`}>{selected ? '✓' : '+'}</span></button>;
                    })}
                  </div>
                </div>

                <button type="button" onClick={() => updatePreferences({ hiddenGems: !preferences.hiddenGems })} className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition ${preferences.hiddenGems ? 'border-amber-400 bg-amber-50 ring-4 ring-amber-100' : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'}`}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-xl">✦</span>
                  <span className="flex-1"><span className="block font-semibold text-slate-900">Prioritize hidden gems</span><span className="mt-1 block text-sm leading-5 text-slate-500">Boost well-rated places with fewer reviews instead of only showing the most popular attractions.</span></span>
                  <span className={`mt-1 flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition ${preferences.hiddenGems ? 'justify-end bg-amber-500' : 'justify-start bg-slate-300'}`}><span className="h-4 w-4 rounded-full bg-white shadow" /></span>
                </button>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-7">
                <StepHeader step="STEP 3" title="Shape each day" description="Add your base and practical needs, then choose places from the map." />
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="font-semibold text-slate-900">Where are you staying?</h3><p className="mt-1 text-xs text-slate-500">Optional. This gives the itinerary a useful home base.</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <input value={preferences.hotelName || ''} onChange={event => updatePreferences({ hotelName: event.target.value })} className={fieldClass} placeholder="Hotel or home-base name" aria-label="Hotel or home-base name" />
                    <input value={preferences.hotelAddress || ''} onChange={event => updatePreferences({ hotelAddress: event.target.value })} className={fieldClass} placeholder="Address or neighborhood" aria-label="Hotel address or neighborhood" />
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Start each day"><input id="dailyStart" type="time" value={preferences.dailyStartTime} onChange={event => updatePreferences({ dailyStartTime: event.target.value })} className={fieldClass} /></Field>
                  <Field label="Finish each day"><input id="dailyEnd" type="time" value={preferences.dailyEndTime} onChange={event => updatePreferences({ dailyEndTime: event.target.value })} className={fieldClass} /></Field>
                  <Field label="Food preferences"><input id="dietary" value={preferences.dietaryPreferences || ''} onChange={event => updatePreferences({ dietaryPreferences: event.target.value })} className={fieldClass} placeholder="Vegetarian, halal, allergies…" /></Field>
                  <Field label="Accessibility or mobility"><input id="accessibility" value={preferences.accessibilityNeeds || ''} onChange={event => updatePreferences({ accessibilityNeeds: event.target.value })} className={fieldClass} placeholder="Step-free access, limited walking…" /></Field>
                </div>
                <Field label="Anything else?"><textarea id="notes" value={preferences.notes || ''} onChange={event => updatePreferences({ notes: event.target.value })} className={fieldClass} rows={3} placeholder="Must-see places, preferred neighborhoods, celebrations, or other context" /></Field>

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div><h3 className="font-semibold text-blue-950">Choose places for your itinerary</h3><p className="mt-1 text-sm text-blue-700">Search the map, add attractions or food spots, then return here to create the schedule.</p></div>
                    <button type="button" onClick={() => setActiveTab('map')} className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Explore places →</button>
                  </div>
                  {selectedPlaces.length > 0 ? <div className="mt-4 flex flex-wrap gap-2">{selectedPlaces.map(place => <span key={place.id} className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-2 text-sm text-slate-700">{place.name}<button type="button" onClick={() => removePlace(place.id)} className="text-slate-400 hover:text-red-600" aria-label={`Remove ${place.name}`}>×</button></span>)}</div> : <div className="mt-4 rounded-xl border border-dashed border-blue-300 px-4 py-4 text-center text-sm text-blue-700">No places selected yet. You can still create a flexible trip and add places later.</div>}
                </div>
              </div>
            )}
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <button type="button" onClick={cancelPlanning} className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-200 hover:text-slate-800">Cancel</button>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              {currentStep > 1 && <button type="button" onClick={() => setCurrentStep(currentStep - 1)} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">← Back</button>}
              {currentStep < 3 ? <button type="button" onClick={() => setCurrentStep(currentStep + 1)} disabled={currentStep === 1 && !basicsComplete} className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">Continue →</button> : <button type="button" onClick={createTrip} disabled={!basicsComplete} className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">Create my itinerary</button>}
            </div>
          </footer>
        </main>

        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-6">
          <div className="flex items-center justify-between"><h2 className="font-bold text-slate-900">Trip snapshot</h2><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Live</span></div>
          <div className="mt-5 space-y-4">
            <SummaryRow label="Destination" value={destination || 'Not chosen'} />
            <SummaryRow label="Dates" value={tripDays ? `${tripDays} day${tripDays === 1 ? '' : 's'}` : 'Not chosen'} />
            <SummaryRow label="Pace" value={travelPace.charAt(0).toUpperCase() + travelPace.slice(1)} />
            <SummaryRow label="Travelers" value={String(preferences.travelers)} />
            <SummaryRow label="Budget" value={preferences.budget ? `${preferences.currency} ${preferences.budget.toLocaleString()}` : 'Flexible'} />
            <SummaryRow label="Interests" value={interests.length ? `${interests.length} selected` : 'Open to anything'} />
            <SummaryRow label="Places" value={selectedPlaces.length ? `${selectedPlaces.length} selected` : 'Add later'} />
          </div>
          <div className="mt-6 rounded-2xl bg-slate-950 p-4 text-white"><div className="flex items-center gap-2 text-sm font-semibold"><span className="text-emerald-400">●</span> No paid AI calls</div><p className="mt-2 text-xs leading-5 text-slate-300">Itinerary generation runs inside TravelEase. Google quota is used only when you search destinations, explore places, or request map routes.</p></div>
        </aside>
      </div>
    </div>
  );
}

function StepHeader({ step, title, description }: { step: string; title: string; description: string }) {
  return <header><p className="text-sm font-semibold text-blue-600">{step}</p><h2 className="mt-1 text-2xl font-bold text-slate-900">{title}</h2><p className="mt-2 text-sm text-slate-500">{description}</p></header>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <div><label className="mb-2 block text-sm font-semibold text-slate-700">{label} {hint && <span className="font-normal text-slate-400">({hint})</span>}</label>{children}</div>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0"><span className="text-sm text-slate-400">{label}</span><span className="text-right text-sm font-semibold text-slate-700">{value}</span></div>;
}
