import { ClusterPopup } from "@/components/UI/ClusterPopup/ClusterPopup";
import Drawer from "@/components/UI/Drawer/Drawer";
import FooterBanner from "@/components/UI/FooterBanner/FooterBanner";
import {
  LocationsResponse,
  MarkerData,
  CoordinatesURLParameters,
} from "@/mocks/types";
import { useMapActions, useCoordinates } from "@/stores/mapStore";
import styles from "@/styles/Home.module.css";
import Container from "@mui/material/Container";
import dynamic from "next/dynamic";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

import {
  KeyboardEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Partytown } from "@builder.io/partytown/react";
import dataTransformer from "@/utils/dataTransformer";
import useDebounce from "@/hooks/useDebounce";

const LeafletMap = dynamic(() => import("@/components/UI/Map"), {
  ssr: false,
});

const baseURL = "https://api.afetharita.com/tweets/locations";

export default function Home() {
  const { toggleDrawer, setDrawerData, setPopUpData } = useMapActions();
  const coordinates: CoordinatesURLParameters | undefined = useCoordinates();

  const [data, setData] = useState<LocationsResponse | undefined>(undefined);
  const [results, setResults] = useState<MarkerData[]>([]);

  const [url, setURL] = useState(baseURL);
  const debouncedURL = useDebounce(url, 500);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(url);
      setData(await response.json());
    } catch (error) {
      console.error(error);
    }
  }, [url]);

  useEffect(() => {
    // FIXME: Use debounce correctly (It's 07 am :) )
    fetchData();
  }, [debouncedURL]);

  useEffect(() => {
    const urlParams = new URLSearchParams(coordinates as any);
    setURL(baseURL + "?" + urlParams.toString());
  }, [coordinates]);

  useEffect(() => {
    if (!data?.results) return;

    setResults(dataTransformer(data));
  }, [data]);

  const handleMarkerClick = useCallback(
    () => (event: KeyboardEvent | MouseEvent, markerData?: MarkerData) => {
      if (
        event.type === "keydown" &&
        ((event as KeyboardEvent).key === "Tab" ||
          (event as KeyboardEvent).key === "Shift")
      )
        return;

      toggleDrawer();

      if (markerData) {
        setDrawerData(markerData);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const togglePopUp = useCallback(
    (e: any) => {
      e.cluster.zoomToBounds({ padding: [20, 20] });

      setPopUpData({
        count: e.markers.length ?? 0,
        baseMarker: e.markers[0].options.markerData,
        markers: e.markers,
      });
    },
    [setPopUpData]
  );

  return (
    <>
      <Head>
        <Partytown debug={true} forward={["dataLayer.push"]} />
        <title>Afet Haritası | Anasayfa</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.logoContainer}>
          <Link
            href="https://www.depremyardim.com/"
            target="_blank"
            className={styles.logo}
          >
            <div className={styles.logoWrapper}>
              <p>Yardım İstemek İçin Tıkla</p>
              <Image
                src="/logo.svg"
                width={64}
                height="64"
                alt="Afet Haritası"
              />
            </div>
          </Link>
        </div>
        <Container maxWidth={false} disableGutters>
          <LeafletMap
            // @ts-expect-error
            onClickMarker={handleMarkerClick()}
            data={results}
            onClusterClick={togglePopUp}
          />
        </Container>
        <Drawer toggler={handleMarkerClick()} />
        <ClusterPopup />
        <FooterBanner />
      </main>
    </>
  );
}
