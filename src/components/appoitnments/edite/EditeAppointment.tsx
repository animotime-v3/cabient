import state, { assets, Client, doctor, events, service } from "@/Types/types";

import { DialogActions } from "@mui/material";
import React, { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { submitValidation } from "@/components/validation";
import toast from "react-hot-toast";
import {
  getRandomHexCode,
  updateAppointment as UpdateAppointment,
} from "@/components/Crud";
import useDataStore from "@/store/data";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import DetailFormEdite from "./DetailFormEdite";
import useOverlay from "@/store/overlayToggle";
import { ProcessedEvent, SchedulerHelpers } from "@/components/schedular/types";
interface props {
  sch: SchedulerHelpers;
  clients: Client[];
  services: service[];
  doctors: doctor[];
}
function EditeAppointment(props: props) {
  const { getClients, updateAppointment, getAppointments } = useDataStore();
  const { toggleOverlayStatu } = useOverlay();
  const event = props.sch.edited;
  // const [component, setComponent] = useState<"detail" | "client">("detail");
  const [error, setError] = useState("");
  const [state, setState] = useState<state>({
    title: event?.title || "",
    client: event?.title || "",
    doctors: (event?.doctors as string) || "",
    start: {
      value: props.sch.state.start.value,
      validity: true,
      type: "date",
    },
    end: {
      value: props.sch.state.end.value,
      validity: true,
      type: "date",
    },
    service: (event?.service as string) || "",
    assets: event?.assets || [],
    color: event?.color || "#06b6d4",
    assetsBlob: [],
    paid: event?.paid || false,
    amount: event?.amount || undefined,
  });

  const handelUpdateDetail = async () => {
    toggleOverlayStatu();
    try {
      const id = nanoid(30);
      handleChangeDetail(state.title, "client");
      console.log("---------------------------\n");
      const clientName = state.title as string;
      console.log(state.title);
      const client_id = getClients().find(
        (e) => e.fullName.toLocaleLowerCase() === clientName.toLocaleLowerCase()
      );
      console.log("\n---------------------------\n");
      const validate = await submitValidation(
        { ...state, client: client_id?._id as string },
        getAppointments(),
        "edite"
      );
      if (!validate.approved) {
        setError(validate.msg);
        throw Error(validate.msg);
      }
      toast.loading("Chargement en cours...");
      const appointment = await UpdateAppointment(
        props.sch.edited?.event_id as string,
        { ...state, client: client_id?._id as string },
        props.clients
      );
      if (!!appointment) {
        console.log(appointment);
        const id = props.sch.edited?.event_id as string;
        updateAppointment(id, {
          ...state,
          start: new Date(state.start.value),
          client: appointment.client._ref,
          end: new Date(state.end.value),
          _id: id,
          event_id: id,
          _type: "reservation",
        } as events);
      }
      // handleChangeDetail(getRandomHexCode(), "color");
      const added_updated_event = (await new Promise((res) => {
        res({
          event_id: props.sch.edited?.event_id || `reservation_${id}`,
          title: `${state.title}`,
          start: state.start.value,
          end: state.end.value,
          doctors: state.doctors,
          service: state.service,
          assets: state.assets,
          client: state.client,
          color: state.color,
          paid: state.paid,
          amount: state.amount,
        });
      })) as ProcessedEvent;
      toast.dismiss();
      toast.success("Terminé");
      props.sch.onConfirm(added_updated_event, "edit");
      props.sch.close();
    } catch (error) {
      toast.dismiss();
      toast.error("Oops !");
      console.log(error);
    } finally {
      toggleOverlayStatu();
    }
  };

  const handleChangeDetail = (
    value: string | Date | string[] | assets[] | number,
    name: string
  ) => {
    if (name === "start" || name === "end") {
      setState((prev) => {
        return {
          ...prev,
          [name]: { ...prev[name], value: value },
        };
      });
    } else if (name === "title") {
      const clientName = value as string;
      const client_id = getClients().find(
        (e) => e.fullName.toLocaleLowerCase() === clientName.toLocaleLowerCase()
      );
      console.log({ value, client_id });
      setState((pre) => {
        return {
          ...pre,
          title: value as string,
          client: client_id?._id || "",
        };
      });

      return;
    } /* else if(name === "assetsBlob"){
    //   setState((pre)=> ({
    //     ...pre,
    //     assetsBlob: 
    //   }))
    //   return
     }*/ else {
      setState((prev) => {
        return {
          ...prev,
          [name]: value,
        };
      });
    }
  };

  useEffect(() => {
    console.log("run effect", state.doctors);
    setError("");
  }, [state]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="dialog p-6 min-w-[900px] overflow-x-hidden flex flex-col gap-y-8">
        <section>
          <div className="flex items-center justify-between">
            <div className="operation flex items-center gap-5">
              <p className="text-xl uppercase font-semibold">
                Modifre une réservation
              </p>
            </div>
            <div className="icon">
              <DialogActions>
                <button
                  onClick={() => props.sch.close()}
                  className="btn btn-circle p-1 bg-white hover:bg-white"
                >
                  x
                </button>
              </DialogActions>
            </div>
          </div>
          <div className="divider before:bg-primary after:bg-primary my-0.5"></div>
        </section>
        <div className="tab-switcher rounded-full  border border-solid flex items-center">
          <button
            className={`btn no-animation bg-primary hover:bg-primary text-white  capitalize  rounded-full flex-grow `}
          >
            Détail
          </button>
          {/* 
          <button
            onClick={() => setComponent("client")}
            className={`btn ${
              component !== "client"
                ? "bg-white hover:bg-white border-none"
                : "bg-blue-50 hover:bg-blue-50"
            }  no-animation capitalize  outline-none flex-grow  rounded-full`}
          >
            Client
          </button> */}
        </div>
        <div className={`detail_component flex flex-col gap-8 justify-center`}>
          <DetailFormEdite
            state={state}
            sch={props.sch}
            handleChangeDetail={handleChangeDetail}
          />
        </div>
        {error && (
          <div className="error w-full">
            <p className="text-error text text-center">{error}</p>
          </div>
        )}
        <div className="w-full flex items-center justify-end">
          <DialogActions>
            <button
              className="btn border-gray-500 capitalize rounded-full btn-outline"
              onClick={props.sch.close}
            >
              Annuler Réservation
            </button>
            <button
              className="bg-primary btn btn-wide capitalize hover:bg-primary text-white rounded-full"
              onClick={() => handelUpdateDetail()}
            >
              Modifier un rendez-vous
            </button>
          </DialogActions>
        </div>
      </div>
    </LocalizationProvider>
  );
}

export default EditeAppointment;
