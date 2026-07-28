export interface ThingData {
  /**
   * thing id
   */
  thing_id: string | number;
  /**
   * thing name
   */
  name: string;
  /**
   * you login name in thingiverse
   */
  creator: string;
  /**
   * thing description
   */
  description: string;
  /**
   * print and construction instructions
   */
  instructions: string;
  /**
   * list of tag names
   */
  tags: string[];
  /**
   * Set the category of the thing. Uses full category name (eg. "3D Printer Parts")
   */
  category: string;
  /**
   * model license
   */
  license: "cc" | "cc-sa" | "cc-nd" | "cc-nc-sa" | "cc-nc-nd" | "pd0" | "gpl" | "lgpl" | "bsd";
  /**
   *   Toggle whether this thing is a customizable model.
   */
  is_customizer: boolean;
  /**
   * 	Toggle whether this thing is a work in progress.
   */
  is_wip: boolean;
  /**
   * 	Toggle whether this thing is published.
   */
  is_published: boolean;
  /**
   * An array of thing ids that this thing is derived from.
   */
  ancestors: (string | number)[];
  /**
   * 	Toggle whether this thing is a remix of another thing.
   */
  is_remix: boolean;
}
