import { useState } from "react";
import { Dialog } from "../../../../components/dialog";
import styles from "./scenario-dialog.module.css";

interface ScenarioDialogProps {
  onClose: () => void;
  onSave: (name: string, description?: string) => void;
}

export function ScenarioDialog({ onClose, onSave }: ScenarioDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (name.trim()) {
      onSave(name, description);
    }
  };

  const footer = (
    <>
      <button className={styles.cancelButton} onClick={onClose}>Cancel</button>
      <button 
        className={styles.saveButton} 
        onClick={() => handleSubmit()}
        disabled={!name.trim()}
      >
        Create Scenario
      </button>
    </>
  );

  return (
    <Dialog title="New Scenario" onClose={onClose} footer={footer} maxWidth={400}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Scenario Name</label>
          <input
            autoFocus
            type="text"
            className={styles.input}
            placeholder="e.g. Morning Rush"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Description (optional)</label>
          <textarea
            className={styles.textarea}
            placeholder="What are you simulating?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </form>
    </Dialog>
  );
}
