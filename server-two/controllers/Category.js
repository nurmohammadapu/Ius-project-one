const { db } = require("../config/database");
function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '') || text.toLowerCase().trim().replace(/\s+/g, '-');
}


function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// 1. createCategory (Pure Raw Query)
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const trimmedName = name.trim();
    const slugId = generateSlug(trimmedName);

    const existing = await db.$query`
      SELECT id FROM "Category" 
      WHERE LOWER(name) = LOWER(${trimmedName}) OR id = ${slugId} 
      LIMIT 1
    `;
    if (existing && existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    const categoryDetails = await db.$query`
      INSERT INTO "Category" (id, name, description)
      VALUES (
        ${slugId},
        ${trimmedName},
        ${description || null}
      )
      RETURNING *
    `;

    return res.status(200).json({
      success: true,
      message: "Category Created Successfully",
      data: categoryDetails[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. showAllCategories (Pure Raw Query with JSON Aggregation)
exports.showAllCategories = async (req, res) => {
  try {
    const allCategories = await db.$query`
      SELECT 
        cat.id,
        cat.name,
        cat.description,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', c.id,
                'courseName', c."courseName",
                'courseDescription', c."courseDescription",
                'price', c.price,
                'thumbnail', c.thumbnail,
                'status', c.status
              )
            )
            FROM "Course" c
            WHERE c."categoryId" = cat.id
          ),
          '[]'::json
        ) AS courses
      FROM "Category" cat
      ORDER BY cat.name ASC
    `;

    return res.status(200).json({
      success: true,
      data: allCategories,
    });
  } catch (error) {
    console.error("SHOW ALL CATEGORIES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. categoryPageDetails (Pure Raw Query with Subqueries & Aggregations)
exports.categoryPageDetails = async (req, res) => {
  try {
    const { categoryId } = req.body;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required",
      });
    }

    // A. Selected Category with Published Courses and Ratings
    const selectedCategoryResult = await db.$query`
      SELECT 
        cat.id,
        cat.name,
        cat.description,
        COALESCE(
          json_agg(
            json_build_object(
              'id', c.id,
              'courseName', c."courseName",
              'courseDescription', c."courseDescription",
              'price', c.price,
              'thumbnail', c.thumbnail,
              'status', c.status,
              'ratingAndReviews', (
                SELECT COALESCE(json_agg(r.*), '[]'::json)
                FROM "RatingAndReview" r
                WHERE r."courseId" = c.id
              )
            )
          ) FILTER (WHERE c.id IS NOT NULL AND c.status = 'Published'::"CourseStatus"),
          '[]'::json
        ) AS courses
      FROM "Category" cat
      LEFT JOIN "Course" c ON cat.id = c."categoryId"
      WHERE cat.id = ${categoryId}
      GROUP BY cat.id
    `;

    const selectedCategory = selectedCategoryResult[0];

    if (!selectedCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (!selectedCategory.courses || selectedCategory.courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No courses found for the selected category.",
      });
    }

    // B. Get Random Different Category
    const otherCategories = await db.$query`
      SELECT id FROM "Category" WHERE id != ${categoryId}
    `;

    let differentCategory = null;
    if (otherCategories && otherCategories.length > 0) {
      const randomIndex = getRandomInt(otherCategories.length);
      const randomCategoryId = otherCategories[randomIndex].id;

      const differentCategoryResult = await db.$query`
        SELECT 
          cat.id,
          cat.name,
          cat.description,
          COALESCE(
            json_agg(c.*) FILTER (WHERE c.id IS NOT NULL AND c.status = 'Published'::"CourseStatus"),
            '[]'::json
          ) AS courses
        FROM "Category" cat
        LEFT JOIN "Course" c ON cat.id = c."categoryId"
        WHERE cat.id = ${randomCategoryId}
        GROUP BY cat.id
      `;
      differentCategory = differentCategoryResult[0] || null;
    }

    // C. Top Selling Courses Across All Categories (Joining "CourseEnrollment")
    const mostSellingCourses = await db.$query`
      SELECT 
        c.id,
        c."courseName",
        c."courseDescription",
        c.price,
        c.thumbnail,
        c.status,
        c."categoryId",
        COUNT(es."userId")::int AS "enrolledCount"
      FROM "Course" c
      LEFT JOIN "CourseEnrollment" es ON es."courseId" = c.id
      WHERE c.status = 'Published'::"CourseStatus"
      GROUP BY c.id
      ORDER BY "enrolledCount" DESC
      LIMIT 10
    `;

    res.status(200).json({
      success: true,
      data: {
        selectedCategory,
        differentCategory,
        mostSellingCourses,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// 4. updateCategory (Pure Raw Query)
exports.updateCategory = async (req, res) => {
  try {
    const { categoryId, name, description } = req.body;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required",
      });
    }

    const existingCategory = await db.$query`
      SELECT * FROM "Category" WHERE id = ${categoryId}
    `;

    if (!existingCategory || existingCategory.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const currentCat = existingCategory[0];
    const updatedName = name ? name.trim() : currentCat.name;
    const updatedDescription = description !== undefined ? description : currentCat.description;

    // Check if another category already has this name
    if (name && updatedName.toLowerCase() !== currentCat.name.toLowerCase()) {
      const duplicate = await db.$query`
        SELECT id FROM "Category"
        WHERE LOWER(name) = LOWER(${updatedName}) AND id != ${categoryId}
        LIMIT 1
      `;
      if (duplicate && duplicate.length > 0) {
        return res.status(400).json({
          success: false,
          message: "A category with this name already exists",
        });
      }
    }

    const updatedCategory = await db.$query`
      UPDATE "Category"
      SET 
        name = ${updatedName},
        description = ${updatedDescription}
      WHERE id = ${categoryId}
      RETURNING *
    `;

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: "A category with this name already exists",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// 5. deleteCategory (Pure Raw Query)
exports.deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.body;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required",
      });
    }

    const existingCategory = await db.$query`
      SELECT id, name FROM "Category" WHERE id = ${categoryId} LIMIT 1
    `;

    if (!existingCategory || existingCategory.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Set categoryId in courses to null before deleting
    await db.$execute`
      UPDATE "Course" SET "categoryId" = NULL WHERE "categoryId" = ${categoryId}
    `;

    await db.$execute`
      DELETE FROM "Category" WHERE id = ${categoryId}
    `;

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("DELETE CATEGORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: error.message,
    });
  }
};
