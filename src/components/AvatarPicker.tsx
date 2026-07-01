import React from "react";
import { AVATAR_OPTIONS } from "../constants/avatars";
import "./AvatarPicker.css";

interface AvatarPickerProps {
  value: string;
  onChange: (avatarId: string) => void;
}

const AvatarPicker: React.FC<AvatarPickerProps> = ({ value, onChange }) => {
  return (
    <div className="avatar-grid">
      {AVATAR_OPTIONS.map((avatar) => {
        const Icon = avatar.Icon;
        const selected = value === avatar.id;

        return (
          <button
            key={avatar.id}
            type="button"
            onClick={() => onChange(avatar.id)}
            className={`avatar-option ${selected ? "avatar-option--selected" : ""}`}
            title={avatar.label}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
};

export default AvatarPicker;