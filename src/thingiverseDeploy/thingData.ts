export interface ThingData {
  thing_id: string | number;
  name: string;
  /**
   * you login name in thingiverse
   */
  creator: string;
  instructions: string;
  tags: string[];
  /**
   * Set the category of the thing. Uses full category name (eg. "3D Printer Parts")
   */
  category: string;
  license: "cc" | "cc-sa" | "cc-nd" | "cc-nc-sa" | "cc-nc-nd" | "pd0" | "gpl" | "lgpl" | "bsd";
  is_wip: boolean;
  is_published: boolean;
}
