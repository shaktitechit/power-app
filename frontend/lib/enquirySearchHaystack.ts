import type { Enquiry } from "@/store/slices/enquiryApiSlice";

export function enquirySearchHaystack(enquiry: Enquiry): string {
  const assigned =
    enquiry.assigned_to &&
    typeof enquiry.assigned_to === "object" &&
    enquiry.assigned_to !== null
      ? [
          enquiry.assigned_to.name,
          enquiry.assigned_to.email,
          enquiry.assigned_to._id,
        ]
      : enquiry.assigned_to
        ? [String(enquiry.assigned_to)]
        : [];

  const creator =
    enquiry.created_by &&
    typeof enquiry.created_by === "object" &&
    enquiry.created_by !== null
      ? [
          enquiry.created_by.name,
          enquiry.created_by.email,
          enquiry.created_by._id,
        ]
      : [String(enquiry.created_by)];

  const reps = (enquiry.client_representatives ?? []).flatMap((cr) =>
    [cr.name, cr.contact_number, cr.email].filter(Boolean),
  );

  const cf =
    enquiry.converted_facility_id &&
    typeof enquiry.converted_facility_id === "object"
      ? [
          enquiry.converted_facility_id._id,
          enquiry.converted_facility_id.name,
          enquiry.converted_facility_id.city,
        ].filter(Boolean)
      : enquiry.converted_facility_id
        ? [String(enquiry.converted_facility_id)]
        : [];

  const parts = [
    enquiry.name,
    enquiry.city,
    enquiry.address,
    enquiry.client_representative,
    enquiry.client_contact_number,
    enquiry.client_email,
    enquiry.enquiry_status,
    enquiry.source,
    enquiry.notes,
    enquiry.expected_value,
    enquiry.requested_audit_types?.join(" "),
    enquiry.next_followup_date,
    enquiry._id,
    enquiry.is_converted_to_facility ? "converted facility" : "",
    ...assigned,
    ...creator,
    ...reps,
    ...cf,
  ];

  return parts.filter(Boolean).join(" ").toLowerCase();
}
