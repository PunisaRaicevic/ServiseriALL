import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Square, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n";

interface VoiceRecordButtonProps {
  onReportGenerated: (reportData: {
    description: string;
    workDuration: number;
    sparePartsUsed: string | null;
  }) => void;
  disabled?: boolean;
  applianceContext?: {
    maker: string;
    type: string;
    model?: string;
    serialNumber?: string;
  };
  clientContext?: {
    name: string;
  };
}

export default function VoiceRecordButton({
  onReportGenerated,
  disabled = false,
  applianceContext,
  clientContext,
}: VoiceRecordButtonProps) {
  const t = useTranslation();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try different mime types based on browser support
      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg";
        } else {
          mimeType = ""; // Let browser choose
        }
      }
      
      console.log("Using mime type:", mimeType);
      
      const mediaRecorder = mimeType 
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log("Data available, size:", event.data.size);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("Recording stopped, chunks:", audioChunksRef.current.length);
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/webm",
        });
        console.log("Audio blob size:", audioBlob.size);
        
        if (audioBlob.size === 0) {
          toast({
            description: t.voice.transcriptionError,
            variant: "destructive",
          });
          return;
        }
        
        await processAudio(audioBlob);

        // Clean up stream
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error: any) {
      console.error("Microphone access error:", error);
      toast({
        description: t.voice.microphoneError,
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      console.log("Processing audio, size:", audioBlob.size, "type:", audioBlob.type);
      
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      
      // Add context if available
      if (applianceContext) {
        formData.append("applianceContext", JSON.stringify(applianceContext));
        console.log("Added appliance context:", applianceContext);
      }
      if (clientContext) {
        formData.append("clientContext", JSON.stringify(clientContext));
        console.log("Added client context:", clientContext);
      }

      console.log("Sending request to /api/transcribe-voice");
      const response = await apiRequest("POST", "/api/transcribe-voice", formData) as {
        transcript: string;
        reportData: {
          description: string;
          workDuration: number;
          sparePartsUsed: string | null;
        };
      };

      console.log("Received response:", response);
      toast({
        description: t.voice.transcriptionSuccess,
      });

      onReportGenerated(response.reportData);
    } catch (error: any) {
      console.error("Transcription error:", error);
      toast({
        description: error.message || t.voice.transcriptionError,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <Card className="p-4 border-2 border-primary">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <div className="flex-1">
            <p className="text-sm font-medium">{t.voice.processing}</p>
            <p className="text-xs text-muted-foreground">
              {t.voice.processingHint}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (isRecording) {
    return (
      <Card className="p-4 border-2 border-destructive bg-destructive/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Mic className="h-5 w-5 text-destructive" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{t.voice.recording}</p>
            <p className="text-xs text-muted-foreground">{t.voice.recordingHint}</p>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={stopRecording}
            data-testid="button-stop-recording"
          >
            <Square className="h-4 w-4 mr-2" />
            {t.voice.stop}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 overflow-visible hover-elevate cursor-pointer bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div
        className="flex flex-col gap-4"
        onClick={disabled ? undefined : startRecording}
      >
        <div>
          <h3 className="text-base font-semibold mb-1">{t.voice.recordMessage}</h3>
          <p className="text-xs text-muted-foreground">{t.voice.recordHint}</p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-shrink-0 p-3 rounded-full bg-primary/10">
            <Mic className="h-6 w-6 text-primary" />
          </div>
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={disabled ? undefined : startRecording}
            disabled={disabled}
            data-testid="button-start-recording"
            className="flex-shrink-0"
          >
            <Mic className="h-4 w-4 mr-2" />
            {t.voice.record}
          </Button>
        </div>
      </div>
    </Card>
  );
}
