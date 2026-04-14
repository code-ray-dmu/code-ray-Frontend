export const CREATE_ROOM_EVENT = "code-ray-open-create-room";

export function openCreateRoomModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CREATE_ROOM_EVENT));
  }
}
