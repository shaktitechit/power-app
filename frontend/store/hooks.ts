import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";

// Typed dispatch hook
export const useAppDispatch: () => AppDispatch = useDispatch;

// Typed selector hook
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;