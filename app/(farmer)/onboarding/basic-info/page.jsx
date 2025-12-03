"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function BasicInfo() {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [errors, setErrors] = useState({});
  const firstErrorRef = useRef(null);

  const handleDetect = () => {
    if (!navigator.geolocation) return;
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
          );
          const data = await res.json();
          const addr = data.address || {};
          const place = [
            addr.village ||
              addr.town ||
              addr.city ||
              addr.suburb ||
              addr.county,
            addr.state,
          ]
            .filter(Boolean)
            .join(", ");
          setLocation(place || "");
        } catch (err) {
          console.error(err);
        } finally {
          setIsDetecting(false);
        }
      },
      (err) => {
        console.error(err);
        setIsDetecting(false);
      }
    );
  };

  const validate = () => {
    const next = {};
    if (!name || name.trim().length < 2) {
      next.name = t("onboarding.basicInfo.errors.name");
    }
    // require email and validate format
    if (!email || email.trim().length === 0) {
      next.email = t("onboarding.basicInfo.errors.email");
    } else {
      // simple email pattern
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(email)) {
        next.email = t("onboarding.basicInfo.errors.email");
      }
    }
    if (!location || location.trim().length < 3) {
      next.location = t("onboarding.basicInfo.errors.location");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) {
      // focus first invalid field
      if (firstErrorRef.current) {
        firstErrorRef.current.focus();
      }
      return;
    }

    const profile = {
      name: name.trim(),
      email: email.trim(),
      location: location.trim(),
    };
    try {
      localStorage.setItem("onboard_profile", JSON.stringify(profile));
    } catch (e) {
      console.warn("Failed to save onboard profile", e);
    }
    router.push("/onboarding");
  };

  return (
    <div className="relative z-10 max-w-xl mx-auto w-full">
      <Card className="gap-8">
        <CardHeader>
          <h2 className="text-2xl font-bold">
            {t("onboarding.basicInfo.heading")}
          </h2>
          <p className="text-sm text-muted-foreground ">
            {t("onboarding.basicInfo.subheading")}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name" className="mb-2 font-semibold">
              {t("onboarding.basicInfo.labels.name")}
            </Label>
            <Input
              id="name"
              ref={errors.name ? firstErrorRef : null}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("onboarding.basicInfo.placeholders.name")}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-destructive mt-1">
                {errors.name}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="email" className="mb-2 font-semibold">
              {t("onboarding.basicInfo.labels.email")}
            </Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("onboarding.basicInfo.placeholders.email")}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive mt-1">
                {errors.email}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="location" className="mb-2 font-semibold">
              {t("onboarding.basicInfo.labels.location")}
            </Label>
            <div className="flex gap-2">
              <Input
                id="location"
                ref={!errors.name && errors.location ? firstErrorRef : null}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("onboarding.basicInfo.placeholders.location")}
                aria-invalid={!!errors.location}
                aria-describedby={
                  errors.location ? "location-error" : undefined
                }
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleDetect}
                disabled={isDetecting}
                className="shrink-0"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {isDetecting
                  ? t("onboarding.basicInfo.detecting")
                  : t("onboarding.basicInfo.detect")}
              </Button>
            </div>
            {errors.location && (
              <p id="location-error" className="text-sm text-destructive mt-1">
                {errors.location}
              </p>
            )}

            <div className="flex w-full mt-5">
              <Button onClick={handleContinue} className="w-full">
                {t("onboarding.basicInfo.continue")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
