// src/app/data/fields.ts

export interface Field {
    id: number;
    fieldNameEn: string; // English field name for internal use
    fieldNameRu: string; // Russian field name for display purposes
    audioUrl: string;
    transcription: string;
}

export const fields: Field[] = [
    {
        id: 1,
        fieldNameEn: "Settlement",
        fieldNameRu: "Населенный пункт",
        audioUrl: "/audios/settlement.wav",
        transcription: "",
    },
    {
        id: 2,
        fieldNameEn: "Farm",
        fieldNameRu: "Хозяйство",
        audioUrl: "/audios/farm.wav",
        transcription: "",
    },
    {
        id: 3,
        fieldNameEn: "District",
        fieldNameRu: "Район",
        audioUrl: "/audios/district.wav",
        transcription: "",
    },
    {
        id: 4,
        fieldNameEn: "Region",
        fieldNameRu: "Область",
        audioUrl: "/audios/region.wav",
        transcription: "",
    },
    {
        id: 5,
        fieldNameEn: "Signer Full Name",
        fieldNameRu: "ФИО подписанта",
        audioUrl: "/audios/signer_full_name.wav",
        transcription: "",
    },
    {
        id: 6,
        fieldNameEn: "Event Type",
        fieldNameRu: "Тип мероприятия",
        audioUrl: "/audios/event_type.wav",
        transcription: "",
    },
    {
        id: 7,
        fieldNameEn: "Drug",
        fieldNameRu: "Препарат",
        audioUrl: "/audios/drug.wav",
        transcription: "",
    },
    {
        id: 8,
        fieldNameEn: "Dose",
        fieldNameRu: "Доза",
        audioUrl: "/audios/dose.wav",
        transcription: "",
    },
    {
        id: 9,
        fieldNameEn: "Administration Method",
        fieldNameRu: "Метод введения",
        audioUrl: "/audios/administration_method.wav",
        transcription: "",
    },
    {
        id: 10,
        fieldNameEn: "Injection Site",
        fieldNameRu: "Место инъекции",
        audioUrl: "/audios/injection_site.wav",
        transcription: "",
    },
    {
        id: 11,
        fieldNameEn: "List of Animals",
        fieldNameRu: "Список животных",
        audioUrl: "/audios/list_of_animals.wav",
        transcription: "",
    },
];
